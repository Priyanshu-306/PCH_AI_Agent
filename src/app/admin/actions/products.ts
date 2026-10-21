"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/format";
import { importProducts, importServices, importSpend, type ImportReport } from "@/lib/excel";

const n = z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().nonnegative().nullable());

const Product = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(60),
  nameEn: z.string().trim().min(1, "Name is required").max(200),
  nameHi: z.string().trim().max(200).optional(),
  slug: z.string().trim().max(160).optional(),
  categoryId: z.preprocess((v) => (v ? Number(v) : null), z.number().int().nullable()),
  crystals: z.string().trim().default(""),
  descriptionEn: z.string().default(""),
  descriptionHi: z.string().optional(),
  healingProperties: z.string().trim().default(""),
  chakras: z.string().trim().default(""),
  zodiac: z.string().trim().default(""),
  size: z.string().trim().optional(),
  weightGrams: n,
  mrp: z.coerce.number().positive("MRP must be more than 0"),
  salePrice: n,
  gstPercent: z.coerce.number().min(0).max(28),
  hsnCode: z.string().trim().optional(),
  stockQty: z.coerce.number().int().min(0),
  status: z.enum(["active", "draft", "out_of_stock"]),
  images: z.string().transform((s) => (s ? (JSON.parse(s) as string[]) : [])),
  video: z.string().trim().optional(),
});

export async function saveProduct(form: FormData) {
  const user = await requireStaff("products");
  const id = Number(form.get("id")) || null;
  const raw = Object.fromEntries(form);
  const parsed = Product.safeParse({ ...raw, isFeatured: undefined });
  const back = id ? `/admin/products/${id}` : "/admin/products/new";
  if (!parsed.success) redirect(`${back}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const d = parsed.data;
  const values = {
    ...d,
    slug: slugify(d.slug || d.nameEn),
    nameHi: d.nameHi || null,
    descriptionHi: d.descriptionHi || null,
    size: d.size || null,
    hsnCode: d.hsnCode || null,
    video: d.video || null,
    weightGrams: d.weightGrams,
    isFeatured: form.get("isFeatured") === "on",
  };
  const clash = await db.select({ id: products.id }).from(products).where(eq(products.sku, d.sku));
  if (clash.length && clash[0].id !== id) redirect(`${back}?error=${encodeURIComponent("Another product already uses this SKU")}`);
  const slugClash = await db.select({ id: products.id }).from(products).where(eq(products.slug, values.slug));
  if (slugClash.length && slugClash[0].id !== id) values.slug = `${values.slug}-${slugify(d.sku)}`;

  let savedId = id;
  if (id) {
    const [before] = await db.select().from(products).where(eq(products.id, id));
    const [after] = await db.update(products).set(values).where(eq(products.id, id)).returning();
    await audit(user, { action: "update", entity: "product", entityId: id, summary: `Updated product ${after.nameEn} (${after.sku})`, before, after });
  } else {
    const [created] = await db.insert(products).values(values).returning();
    savedId = created.id;
    await audit(user, { action: "create", entity: "product", entityId: created.id, summary: `Added product ${created.nameEn} (${created.sku})`, after: created });
  }
  revalidatePath("/admin/products");
  redirect(`/admin/products/${savedId}?saved=1`);
}

export async function deleteProduct(form: FormData) {
  const user = await requireStaff("products");
  const id = Number(form.get("id"));
  const [before] = await db.delete(products).where(eq(products.id, id)).returning();
  if (before) await audit(user, { action: "delete", entity: "product", entityId: id, summary: `Deleted product ${before.nameEn} (${before.sku})`, before });
  redirect("/admin/products?saved=Product%20deleted");
}

export async function quickStock(form: FormData) {
  const user = await requireStaff("products");
  const id = Number(form.get("id"));
  const stockQty = Math.max(0, Math.round(Number(form.get("stockQty"))));
  const [before] = await db.select().from(products).where(eq(products.id, id));
  if (!before) return;
  const [after] = await db.update(products).set({ stockQty }).where(eq(products.id, id)).returning();
  await audit(user, { action: "update", entity: "product", entityId: id, summary: `Stock for ${after.nameEn}: ${before.stockQty} → ${stockQty}`, before, after });
  revalidatePath("/admin/products");
}

export type ImportState = (ImportReport & { kind: string }) | { error: string } | null;

export async function runImport(_: ImportState, form: FormData): Promise<ImportState> {
  const kind = String(form.get("kind"));
  const user = await requireStaff(kind === "services" ? "services" : kind === "marketing" ? "marketing" : "products");
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Please choose an .xlsx file" };
  if (!file.name.toLowerCase().endsWith(".xlsx")) return { error: "Only .xlsx files are supported (save CSV/XLS as .xlsx first)" };
  try {
    const buf = await file.arrayBuffer();
    const report = kind === "services" ? await importServices(buf) : kind === "marketing" ? await importSpend(buf, user.id) : await importProducts(buf);
    await audit(user, {
      action: "import",
      entity: kind,
      summary: `Excel import (${file.name}): ${report.created} created, ${report.updated} updated, ${report.errors.length} errors`,
      after: report,
    });
    revalidatePath(`/admin/${kind}`);
    return { ...report, kind };
  } catch (e) {
    return { error: `Could not read the file: ${(e as Error).message}` };
  }
}

export async function saveCategory(form: FormData) {
  const user = await requireStaff("products");
  const id = Number(form.get("id")) || null;
  const nameEn = String(form.get("nameEn") ?? "").trim();
  if (!nameEn) redirect("/admin/categories?error=Name%20is%20required");
  const values = { nameEn, nameHi: String(form.get("nameHi") ?? "").trim() || null, sort: Number(form.get("sort") ?? 0), slug: slugify(String(form.get("slug") || nameEn)) };
  if (id) {
    const [before] = await db.select().from(categories).where(eq(categories.id, id));
    const [after] = await db.update(categories).set(values).where(eq(categories.id, id)).returning();
    await audit(user, { action: "update", entity: "category", entityId: id, summary: `Updated category ${nameEn}`, before, after });
  } else {
    const [c] = await db.insert(categories).values(values).onConflictDoNothing().returning();
    if (c) await audit(user, { action: "create", entity: "category", entityId: c.id, summary: `Added category ${nameEn}`, after: c });
  }
  redirect("/admin/categories?saved=1");
}

export async function deleteCategory(form: FormData) {
  const user = await requireStaff("products");
  const id = Number(form.get("id"));
  const [before] = await db.delete(categories).where(eq(categories.id, id)).returning();
  if (before) await audit(user, { action: "delete", entity: "category", entityId: id, summary: `Deleted category ${before.nameEn}`, before });
  redirect("/admin/categories?saved=Category%20deleted");
}
