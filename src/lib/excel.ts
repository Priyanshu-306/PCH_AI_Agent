import "server-only";
import ExcelJS from "exceljs";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, marketingSpend, media, products, services, trainers } from "@/db/schema";
import { slugify } from "./format";

export type ImportReport = { created: number; updated: number; skipped: number; errors: { row: number; message: string }[] };

/** Reads a worksheet into objects keyed by normalised header (row 1). Skips the template's notes row. */
async function readSheet(buffer: ArrayBuffer, preferred: string[]) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = preferred.map((n) => wb.worksheets.find((w) => w.name.toLowerCase() === n.toLowerCase())).find(Boolean) ?? wb.worksheets.find((w) => w.name !== "READ ME");
  if (!ws) throw new Error("No worksheet found");
  const headers: string[] = [];
  ws.getRow(1).eachCell((cell, col) => {
    headers[col] = String(cell.value ?? "").replace(/\*/g, "").trim().toLowerCase().replace(/\s+/g, "_");
  });
  const out: { row: number; data: Record<string, string> }[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const data: Record<string, string> = {};
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const key = headers[col];
      if (!key) return;
      const v = cell.value as unknown;
      const text =
        v && typeof v === "object"
          ? "text" in (v as object)
            ? String((v as { text: unknown }).text)
            : "result" in (v as object)
              ? String((v as { result: unknown }).result)
              : v instanceof Date
                ? v.toISOString().slice(0, 10)
                : "richText" in (v as object)
                  ? (v as { richText: { text: string }[] }).richText.map((r) => r.text).join("")
                  : String(v)
          : String(v ?? "");
      data[key] = text.trim();
    });
    // The template's second row holds column notes, not data.
    if (n === 2 && /^(unique code|yyyy|e\.g\.)/i.test(Object.values(data)[0] ?? "")) return;
    if (Object.values(data).some(Boolean)) out.push({ row: n, data });
  });
  return out;
}

const num = z.preprocess((v) => (v === "" || v == null ? undefined : Number(String(v).replace(/[₹,\s]/g, ""))), z.number().nonnegative().optional());
const yes = (v?: string) => /^(yes|y|true|1)$/i.test(v ?? "");

async function resolveMedia(list: string) {
  const names = list.split(",").map((s) => s.trim()).filter(Boolean);
  if (!names.length) return [];
  const rows = await db.select().from(media).where(inArray(media.originalName, names));
  return names.map((n) => (n.startsWith("/") || n.startsWith("http") ? n : rows.find((r) => r.originalName === n) ? `/media/${rows.find((r) => r.originalName === n)!.filename}` : null)).filter((x): x is string => Boolean(x));
}

const ProductRow = z.object({
  sku: z.string().min(1, "sku is required"),
  name_en: z.string().min(1, "name_en is required"),
  name_hi: z.string().optional(),
  category: z.string().min(1, "category is required"),
  crystals: z.string().default(""),
  description_en: z.string().default(""),
  description_hi: z.string().optional(),
  healing_properties: z.string().default(""),
  chakras: z.string().default(""),
  zodiac: z.string().default(""),
  size: z.string().optional(),
  weight_grams: num,
  mrp_inr: num.refine((v) => v != null && v > 0, "mrp_inr must be a positive number"),
  sale_price_inr: num,
  gst_percent: num,
  hsn_code: z.string().optional(),
  stock_qty: num,
  is_featured: z.string().optional(),
  status: z.string().optional(),
  image_files: z.string().default(""),
  video_file: z.string().optional(),
});

export async function importProducts(buffer: ArrayBuffer): Promise<ImportReport> {
  const rows = await readSheet(buffer, ["Products"]);
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, errors: [] };
  const cats = await db.select().from(categories);
  for (const { row, data } of rows) {
    const parsed = ProductRow.safeParse(data);
    if (!parsed.success) {
      report.errors.push({ row, message: parsed.error.issues.map((i) => i.message).join("; ") });
      continue;
    }
    const d = parsed.data;
    let cat = cats.find((c) => c.nameEn.toLowerCase() === d.category.toLowerCase() || c.slug === slugify(d.category));
    if (!cat) {
      [cat] = await db.insert(categories).values({ slug: slugify(d.category), nameEn: d.category, sort: cats.length }).returning();
      cats.push(cat);
    }
    const status = /draft/i.test(d.status ?? "") ? "draft" : /out/i.test(d.status ?? "") ? "out_of_stock" : "active";
    const images = await resolveMedia(d.image_files);
    const values = {
      sku: d.sku,
      nameEn: d.name_en,
      nameHi: d.name_hi || null,
      categoryId: cat.id,
      crystals: d.crystals,
      descriptionEn: d.description_en,
      descriptionHi: d.description_hi || null,
      healingProperties: d.healing_properties,
      chakras: d.chakras,
      zodiac: d.zodiac,
      size: d.size || null,
      weightGrams: d.weight_grams ?? null,
      mrp: d.mrp_inr!,
      salePrice: d.sale_price_inr ?? null,
      gstPercent: d.gst_percent ?? 3,
      hsnCode: d.hsn_code || null,
      stockQty: Math.round(d.stock_qty ?? 0),
      isFeatured: yes(d.is_featured),
      status: status as "active" | "draft" | "out_of_stock",
      video: d.video_file || null,
    };
    const [existing] = await db.select({ id: products.id, images: products.images }).from(products).where(eq(products.sku, d.sku));
    if (existing) {
      await db.update(products).set({ ...values, images: images.length ? images : existing.images }).where(eq(products.id, existing.id));
      report.updated++;
    } else {
      let slug = slugify(d.name_en);
      if ((await db.select({ id: products.id }).from(products).where(eq(products.slug, slug))).length) slug = `${slug}-${slugify(d.sku)}`;
      await db.insert(products).values({ ...values, slug, images });
      report.created++;
    }
  }
  return report;
}

const ServiceRow = z.object({
  code: z.string().min(1, "code is required"),
  type: z.string().default("Session"),
  name_en: z.string().min(1, "name_en is required"),
  name_hi: z.string().optional(),
  short_description_en: z.string().default(""),
  description_en: z.string().default(""),
  description_hi: z.string().optional(),
  helps_with: z.string().default(""),
  duration_minutes: num,
  mode: z.string().default("Both"),
  price_inr: num,
  trainer: z.string().optional(),
  bookable_online: z.string().optional(),
  status: z.string().optional(),
  image_files: z.string().default(""),
  video_file: z.string().optional(),
});

export async function importServices(buffer: ArrayBuffer): Promise<ImportReport> {
  const rows = await readSheet(buffer, ["Services"]);
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, errors: [] };
  const trainerRows = await db.select().from(trainers);
  for (const { row, data } of rows) {
    const parsed = ServiceRow.safeParse(data);
    if (!parsed.success) {
      report.errors.push({ row, message: parsed.error.issues.map((i) => i.message).join("; ") });
      continue;
    }
    const d = parsed.data;
    const type = (["session", "course", "webinar", "workshop"].find((t) => d.type.toLowerCase().startsWith(t)) ?? "session") as "session";
    const mode = /online/i.test(d.mode) ? "online" : /site|person/i.test(d.mode) ? "onsite" : "both";
    const values = {
      code: d.code,
      type,
      nameEn: d.name_en,
      nameHi: d.name_hi || null,
      shortEn: d.short_description_en,
      descriptionEn: d.description_en,
      descriptionHi: d.description_hi || null,
      helpsWith: d.helps_with,
      durationMinutes: d.duration_minutes ?? null,
      mode: mode as "both",
      price: d.price_inr ?? null,
      trainerId: trainerRows.find((t) => d.trainer && t.name.toLowerCase() === d.trainer.toLowerCase())?.id ?? null,
      bookableOnline: d.bookable_online ? yes(d.bookable_online) : type === "session",
      active: !/draft/i.test(d.status ?? ""),
      image: (await resolveMedia(d.image_files))[0] ?? null,
      video: d.video_file || null,
    };
    const [existing] = await db.select({ id: services.id }).from(services).where(eq(services.code, d.code));
    if (existing) {
      await db.update(services).set(values).where(eq(services.id, existing.id));
      report.updated++;
    } else {
      await db.insert(services).values({ ...values, slug: slugify(d.name_en) });
      report.created++;
    }
  }
  return report;
}

const SpendRow = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "date must be YYYY-MM-DD"),
  brand: z.string().default("Both"),
  channel: z.string().min(1, "channel is required"),
  campaign: z.string().optional(),
  amount_inr: num.refine((v) => v != null, "amount_inr is required"),
  notes: z.string().optional(),
});

export async function importSpend(buffer: ArrayBuffer, staffId: number): Promise<ImportReport> {
  const rows = await readSheet(buffer, ["Marketing Spend", "Marketing"]);
  const report: ImportReport = { created: 0, updated: 0, skipped: 0, errors: [] };
  for (const { row, data } of rows) {
    const parsed = SpendRow.safeParse(data);
    if (!parsed.success) {
      report.errors.push({ row, message: parsed.error.issues.map((i) => i.message).join("; ") });
      continue;
    }
    const d = parsed.data;
    const brand = /crystal|shop/i.test(d.brand) ? "shop" : /pch|healing/i.test(d.brand) ? "healing" : "both";
    await db.insert(marketingSpend).values({ day: d.date.slice(0, 10), brand, channel: d.channel, campaign: d.campaign, amount: d.amount_inr!, notes: d.notes, createdBy: staffId });
    report.created++;
  }
  return report;
}

/** Current catalogue in the same column layout the importer accepts. */
export async function exportProducts() {
  const rows = await db.select({ p: products, category: categories.nameEn }).from(products).leftJoin(categories, eq(products.categoryId, categories.id));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Products");
  ws.columns = [
    "sku", "name_en", "name_hi", "category", "crystals", "description_en", "description_hi", "healing_properties", "chakras", "zodiac", "size",
    "weight_grams", "mrp_inr", "sale_price_inr", "gst_percent", "hsn_code", "stock_qty", "is_featured", "status", "image_files", "video_file",
  ].map((key) => ({ header: key, key, width: 18 }));
  for (const { p, category } of rows)
    ws.addRow({
      sku: p.sku, name_en: p.nameEn, name_hi: p.nameHi, category, crystals: p.crystals, description_en: p.descriptionEn, description_hi: p.descriptionHi,
      healing_properties: p.healingProperties, chakras: p.chakras, zodiac: p.zodiac, size: p.size, weight_grams: p.weightGrams, mrp_inr: Number(p.mrp),
      sale_price_inr: p.salePrice != null ? Number(p.salePrice) : null, gst_percent: Number(p.gstPercent), hsn_code: p.hsnCode, stock_qty: p.stockQty,
      is_featured: p.isFeatured ? "YES" : "NO", status: { active: "Active", draft: "Draft", out_of_stock: "Out of stock" }[p.status], image_files: p.images.join(", "), video_file: p.video,
    });
  ws.getRow(1).font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}
