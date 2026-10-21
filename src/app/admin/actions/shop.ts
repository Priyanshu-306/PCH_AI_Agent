"use server";

import { z } from "zod";
import { and, avg, count, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { coupons, orderItems, orders, products, reviews } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { emailLayout, escapeHtml, sendEmail, sendWhatsApp } from "@/lib/notify";
import { accessToken } from "@/lib/checkout";
import { SHOP_URL } from "@/lib/site";

export async function updateOrder(form: FormData) {
  const user = await requireStaff("orders");
  const id = Number(form.get("id"));
  const [before] = await db.select().from(orders).where(eq(orders.id, id));
  if (!before) redirect("/admin/orders");
  const status = String(form.get("status")) as typeof before.status;
  const paymentStatus = String(form.get("paymentStatus")) as typeof before.paymentStatus;
  const values = {
    status,
    paymentStatus,
    courier: String(form.get("courier") ?? "").trim() || null,
    trackingNumber: String(form.get("trackingNumber") ?? "").trim() || null,
    notes: String(form.get("notes") ?? "").trim() || null,
  };
  const [after] = await db.update(orders).set(values).where(eq(orders.id, id)).returning();

  // Return stock to inventory when a committed order is cancelled.
  if (status === "cancelled" && before.status !== "cancelled" && before.status !== "new") {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    for (const i of items) if (i.productId) await db.update(products).set({ stockQty: sql`${products.stockQty} + ${i.qty}` }).where(eq(products.id, i.productId));
  }
  await audit(user, { action: "update", entity: "order", entityId: id, summary: `Order ${after.number}: ${before.status} → ${status}, payment ${paymentStatus}`, before, after });

  if (form.get("notify") === "on" && status !== before.status) {
    const link = `${SHOP_URL}/order/${after.number}?t=${accessToken(after.number)}`;
    const msg = status === "shipped" && after.trackingNumber ? `Your order ${after.number} has shipped via ${after.courier ?? "courier"} (tracking ${after.trackingNumber}).` : `Your order ${after.number} is now ${status}.`;
    await Promise.allSettled([
      sendEmail({ to: after.email, kind: "order", subject: `Order ${after.number}: ${status}`, link, html: emailLayout(`Order ${status}`, `<p>Dear ${escapeHtml(after.name)},</p><p>${escapeHtml(msg)}</p><p><a href="${link}">Track your order</a></p>`) }),
      sendWhatsApp({ to: after.phone, kind: "order", text: `${msg} Track: ${link} — Pure Crystal Hub` }),
    ]);
  }
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${id}?saved=1`);
}

const Coupon = z.object({
  code: z.string().trim().min(3).max(40).transform((s) => s.toUpperCase().replace(/\s+/g, "")),
  type: z.enum(["percent", "flat"]),
  value: z.coerce.number().positive(),
  minOrder: z.coerce.number().min(0).default(0),
  maxDiscount: z.preprocess((v) => (v === "" ? null : Number(v)), z.number().positive().nullable()),
  usageLimit: z.preprocess((v) => (v === "" ? null : Number(v)), z.number().int().positive().nullable()),
  startsAt: z.preprocess((v) => (v ? new Date(`${v}T00:00:00+05:30`) : null), z.date().nullable()),
  endsAt: z.preprocess((v) => (v ? new Date(`${v}T23:59:59+05:30`) : null), z.date().nullable()),
});

export async function saveCoupon(form: FormData) {
  const user = await requireStaff("coupons");
  const id = Number(form.get("id")) || null;
  const parsed = Coupon.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect(`/admin/coupons?error=${encodeURIComponent(parsed.error.issues[0].path + ": " + parsed.error.issues[0].message)}`);
  const values = { ...parsed.data, active: form.get("active") === "on" };
  if (values.type === "percent" && values.value > 90) redirect("/admin/coupons?error=Percent%20discount%20cannot%20exceed%2090");
  if (id) {
    const [before] = await db.select().from(coupons).where(eq(coupons.id, id));
    const [after] = await db.update(coupons).set(values).where(eq(coupons.id, id)).returning();
    await audit(user, { action: "update", entity: "coupon", entityId: id, summary: `Updated coupon ${after.code}`, before, after });
  } else {
    const [c] = await db.insert(coupons).values(values).onConflictDoNothing().returning();
    if (!c) redirect("/admin/coupons?error=That%20code%20already%20exists");
    await audit(user, { action: "create", entity: "coupon", entityId: c.id, summary: `Created coupon ${c.code}`, after: c });
  }
  redirect("/admin/coupons?saved=1");
}

export async function deleteCoupon(form: FormData) {
  const user = await requireStaff("coupons");
  const [before] = await db.delete(coupons).where(eq(coupons.id, Number(form.get("id")))).returning();
  if (before) await audit(user, { action: "delete", entity: "coupon", entityId: before.id, summary: `Deleted coupon ${before.code}`, before });
  redirect("/admin/coupons?saved=Coupon%20deleted");
}

async function refreshRating(productId: number) {
  const [r] = await db.select({ a: avg(reviews.rating), n: count() }).from(reviews).where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));
  await db.update(products).set({ ratingAvg: Number(r.a ?? 0), ratingCount: Number(r.n) }).where(eq(products.id, productId));
}

export async function moderateReview(form: FormData) {
  const user = await requireStaff("reviews");
  const id = Number(form.get("id"));
  const status = String(form.get("status"));
  if (status === "delete") {
    const [before] = await db.delete(reviews).where(eq(reviews.id, id)).returning();
    if (before) {
      await refreshRating(before.productId);
      await audit(user, { action: "delete", entity: "review", entityId: id, summary: `Deleted review by ${before.name}`, before });
    }
  } else {
    const [before] = await db.select().from(reviews).where(eq(reviews.id, id));
    const [after] = await db.update(reviews).set({ status: status as "approved" }).where(eq(reviews.id, id)).returning();
    await refreshRating(after.productId);
    await audit(user, { action: "status", entity: "review", entityId: id, summary: `Review by ${after.name} ${status}`, before, after });
  }
  revalidatePath("/admin/reviews");
  redirect("/admin/reviews?saved=1");
}
