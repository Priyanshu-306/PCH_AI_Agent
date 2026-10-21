"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { courseBatches, enquiries, products, reviews, services } from "@/db/schema";
import { notifyOwner } from "@/lib/notify";
import { getCustomer } from "@/lib/auth";

export type FormState = { ok?: boolean; error?: string; fields?: Record<string, string> } | null;

const Enquiry = z.object({
  kind: z.enum(["course", "contact"]),
  site: z.enum(["healing", "shop"]).default("healing"),
  serviceId: z.coerce.number().int().optional(),
  batchId: z.coerce.number().int().optional(),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.union([z.email("Please enter a valid email"), z.literal("")]).optional(),
  phone: z.string().trim().min(8, "Please enter a phone number").max(20),
  message: z.string().trim().max(2000).optional(),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitEnquiry(_: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries([...form.entries()].map(([k, v]) => [k, v === "" && (k === "serviceId" || k === "batchId") ? undefined : String(v)]));
  const parsed = Enquiry.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form", fields: raw as Record<string, string> };
  const d = parsed.data;
  if (d.website) return { ok: true };
  let about = "";
  if (d.serviceId) {
    const [s] = await db.select({ name: services.nameEn }).from(services).where(eq(services.id, d.serviceId));
    about = s?.name ?? "";
  }
  if (d.batchId) {
    const [b] = await db.select().from(courseBatches).where(eq(courseBatches.id, d.batchId));
    if (b) about += ` (batch ${b.startsOn}, ${b.location ?? ""})`;
  }
  const [row] = await db
    .insert(enquiries)
    .values({ kind: d.kind, site: d.site, serviceId: d.serviceId, batchId: d.batchId, name: d.name, email: d.email || null, phone: d.phone, message: d.message })
    .returning();
  await notifyOwner({
    kind: "enquiry",
    title: `New ${d.kind === "course" ? "course " : ""}enquiry from ${d.name}`,
    body: `${about ? about + "\n" : ""}${d.phone}${d.email ? " · " + d.email : ""}\n${d.message ?? ""}`,
    link: `/admin/enquiries?open=${row.id}`,
  });
  return { ok: true };
}

const Review = z.object({
  productId: z.coerce.number().int(),
  name: z.string().trim().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(10, "Please write at least a sentence").max(3000),
});

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const parsed = Review.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the form" };
  const [p] = await db.select({ id: products.id, name: products.nameEn }).from(products).where(and(eq(products.id, parsed.data.productId), eq(products.status, "active")));
  if (!p) return { error: "Product not found" };
  const customer = await getCustomer();
  await db.insert(reviews).values({ ...parsed.data, customerId: customer?.id ?? null });
  await notifyOwner({ kind: "review", title: `New ${parsed.data.rating}★ review awaiting approval`, body: `${parsed.data.name} on ${p.name}: ${parsed.data.body.slice(0, 160)}`, link: "/admin/reviews" });
  return { ok: true };
}
