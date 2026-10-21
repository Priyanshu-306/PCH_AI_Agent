import "server-only";
import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookings, coupons, orderItems, orders, products, services } from "@/db/schema";
import { createPaymentOrder, verifyPayment } from "./payments";
import { priceCart } from "./pricing";
import { openSlots } from "./slots";
import { emailLayout, escapeHtml, notifyOwner, sendEmail, sendWhatsApp } from "./notify";
import { fmtDateTime, inr, istDate, makeRef } from "./format";
import { getSetting } from "./settings";
import { HEALING_URL, SHOP_URL } from "./site";

const phone = z.string().trim().regex(/^[+\d][\d\s-]{8,15}$/, "Enter a valid phone number");

/** Unguessable token so customers can open their invoice/confirmation without logging in. */
export const accessToken = (ref: string) =>
  crypto.createHmac("sha256", process.env.AUTH_SECRET || "dev-secret-change-me").update(`ref:${ref}`).digest("hex").slice(0, 24);

/* ================================================================ Bookings */

export const BookingInput = z.object({
  service: z.string(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  mode: z.enum(["online", "onsite"]),
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  phone,
  concern: z.string().max(2000).optional(),
});

export async function createBooking(input: z.infer<typeof BookingInput>) {
  const [svc] = await db.select().from(services).where(and(eq(services.slug, input.service), eq(services.active, true)));
  if (!svc || !svc.bookableOnline) return { error: "This service cannot be booked online." };
  if (svc.mode !== "both" && svc.mode !== input.mode) return { error: "This mode is not available for the service." };
  const duration = svc.durationMinutes ?? 60;
  if (!(await openSlots(input.day, duration)).includes(input.time)) return { error: "That time was just taken. Please choose another slot." };

  const startsAt = istDate(input.day, input.time);
  const price = Number(svc.price ?? 0);
  const number = makeRef("PCH-B");
  const [booking] = await db
    .insert(bookings)
    .values({
      number,
      serviceId: svc.id,
      serviceName: svc.nameEn,
      name: input.name,
      email: input.email,
      phone: input.phone,
      startsAt,
      endsAt: new Date(startsAt.getTime() + duration * 60000),
      mode: input.mode,
      price,
      concern: input.concern,
    })
    .returning();

  if (price <= 0) {
    await finaliseBooking(booking.id);
    return { number, token: accessToken(number), payment: null };
  }
  const payment = await createPaymentOrder(price, number, { kind: "booking", number });
  await db.update(bookings).set({ razorpayOrderId: payment.id }).where(eq(bookings.id, booking.id));
  return { number, token: accessToken(number), payment: { ...payment, name: svc.nameEn, prefill: { name: input.name, email: input.email, contact: input.phone } } };
}

export async function confirmBookingPayment(number: string, paymentId: string, signature: string) {
  const [b] = await db.select().from(bookings).where(eq(bookings.number, number));
  if (!b || !b.razorpayOrderId) return { error: "Booking not found" };
  if (b.paymentStatus === "paid") return { ok: true };
  if (!verifyPayment(b.razorpayOrderId, paymentId, signature)) {
    await db.update(bookings).set({ paymentStatus: "failed" }).where(eq(bookings.id, b.id));
    return { error: "Payment could not be verified" };
  }
  await db.update(bookings).set({ razorpayPaymentId: paymentId, paymentStatus: "paid" }).where(eq(bookings.id, b.id));
  await finaliseBooking(b.id);
  return { ok: true };
}

async function finaliseBooking(id: number) {
  const [b] = await db.update(bookings).set({ status: "confirmed" }).where(eq(bookings.id, id)).returning();
  const cfg = await getSetting("booking");
  const when = fmtDateTime(b.startsAt);
  const link = `${HEALING_URL}/booking/${b.number}?t=${accessToken(b.number)}`;
  await Promise.allSettled([
    notifyOwner({
      kind: "booking",
      title: `New booking · ${b.serviceName}`,
      body: `${b.name} (${b.phone}) booked ${b.serviceName} on ${when}, ${b.mode}. ${b.price ? `Paid ${inr(b.price)}.` : ""}`,
      link: `/admin/bookings/${b.id}`,
    }),
    sendEmail({
      to: b.email,
      kind: "booking",
      subject: `Your session is confirmed — ${b.serviceName}`,
      link,
      html: emailLayout(
        "Your session is confirmed",
        `<p>Dear ${escapeHtml(b.name)},</p><p>Thank you for booking <b>${escapeHtml(b.serviceName)}</b>.</p>
         <p><b>When:</b> ${when} (IST)<br><b>Mode:</b> ${b.mode === "online" ? "Online" : "In person"}<br><b>Reference:</b> ${b.number}</p>
         ${b.mode === "online" ? `<p>${escapeHtml(cfg.onlineNote)}</p>` : ""}
         <p><a href="${link}">View your booking</a></p>`,
      ),
    }),
    sendWhatsApp({ to: b.phone, kind: "booking", text: `Namaste ${b.name}! Your ${b.serviceName} session is confirmed for ${when} IST. Ref ${b.number}. — Pure Conscious Healing` }),
  ]);
}

/* ================================================================ Orders */

export const OrderInput = z.object({
  items: z.array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(99) })).min(1),
  coupon: z.string().max(40).optional().nullable(),
  method: z.enum(["razorpay", "cod", "whatsapp"]),
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  phone,
  line1: z.string().trim().min(3).max(300),
  line2: z.string().trim().max(300).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  notes: z.string().max(1000).optional(),
});

export async function createOrder(input: z.infer<typeof OrderInput>, customerId: number | null) {
  const quote = await priceCart(input.items, input.coupon, input.method);
  if (!quote.items.length) return { error: "Your cart is empty or items are unavailable." };
  if (quote.problems.length) return { error: quote.problems.join(". "), problems: quote.problems };
  if (input.coupon && quote.couponError) return { error: quote.couponError };
  if (input.method === "cod" && !quote.codAllowed) return { error: "Cash on delivery is not available for this order." };
  if (input.method === "whatsapp" && !quote.shippingSettings.whatsappOrderEnabled) return { error: "WhatsApp ordering is currently disabled." };

  const number = makeRef("PCH");
  const order = await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(orders)
      .values({
        number,
        customerId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        shippingAddress: { name: input.name, phone: input.phone, line1: input.line1, line2: input.line2, city: input.city, state: input.state, pincode: input.pincode },
        subtotal: quote.subtotal,
        discount: quote.discount,
        shipping: quote.shipping,
        codFee: quote.codFee,
        gstTotal: quote.gstTotal,
        total: quote.total,
        couponCode: quote.coupon?.code ?? null,
        paymentMethod: input.method,
        notes: input.notes,
      })
      .returning();
    await tx.insert(orderItems).values(
      quote.items.map((i) => ({
        orderId: o.id,
        productId: i.product.id,
        sku: i.product.sku,
        name: i.product.nameEn,
        hsnCode: i.product.hsnCode,
        unitPrice: i.unitPrice,
        qty: i.qty,
        gstPercent: Number(i.product.gstPercent),
      })),
    );
    return o;
  });

  const token = accessToken(number);
  if (input.method === "razorpay") {
    const payment = await createPaymentOrder(quote.total, number, { kind: "order", number });
    await db.update(orders).set({ razorpayOrderId: payment.id }).where(eq(orders.id, order.id));
    return { number, token, payment: { ...payment, name: "Pure Crystal Hub", prefill: { name: input.name, email: input.email, contact: input.phone } } };
  }

  await finaliseOrder(order.id);
  if (input.method === "whatsapp") {
    const contact = await getSetting("contact");
    const lines = quote.items.map((i) => `• ${i.product.nameEn} × ${i.qty} — ${inr(i.lineTotal)}`).join("\n");
    const text = `Namaste! I'd like to place order ${number}:\n${lines}\nTotal: ${inr(quote.total)}\nDeliver to: ${input.name}, ${input.line1}, ${input.city} ${input.pincode}`;
    return { number, token, whatsappUrl: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}` };
  }
  return { number, token };
}

export async function confirmOrderPayment(number: string, paymentId: string, signature: string) {
  const [o] = await db.select().from(orders).where(eq(orders.number, number));
  if (!o || !o.razorpayOrderId) return { error: "Order not found" };
  if (o.paymentStatus === "paid") return { ok: true };
  if (!verifyPayment(o.razorpayOrderId, paymentId, signature)) {
    await db.update(orders).set({ paymentStatus: "failed" }).where(eq(orders.id, o.id));
    return { error: "Payment could not be verified" };
  }
  await db.update(orders).set({ paymentStatus: "paid", razorpayPaymentId: paymentId }).where(eq(orders.id, o.id));
  await finaliseOrder(o.id);
  return { ok: true };
}

/** Reserve stock, count coupon usage and send notifications once an order is committed. */
async function finaliseOrder(id: number) {
  const [o] = await db.update(orders).set({ status: "confirmed" }).where(eq(orders.id, id)).returning();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  const lowStock: string[] = [];
  for (const i of items) {
    if (!i.productId) continue;
    const [p] = await db
      .update(products)
      .set({ stockQty: sql`greatest(${products.stockQty} - ${i.qty}, 0)` })
      .where(eq(products.id, i.productId))
      .returning({ name: products.nameEn, stock: products.stockQty });
    if (p && p.stock <= 3) lowStock.push(`${p.name} (${p.stock} left)`);
  }
  if (o.couponCode) await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.code, o.couponCode));

  const link = `${SHOP_URL}/order/${o.number}?t=${accessToken(o.number)}`;
  const method = { razorpay: "Paid online", cod: "Cash on delivery", whatsapp: "WhatsApp order" }[o.paymentMethod];
  const rows = items.map((i) => `<tr><td>${escapeHtml(i.name)} × ${i.qty}</td><td align="right">${inr(Number(i.unitPrice) * i.qty)}</td></tr>`).join("");
  await Promise.allSettled([
    notifyOwner({ kind: "order", title: `New order ${o.number} · ${inr(o.total)}`, body: `${o.name} (${o.phone}) — ${items.length} item(s), ${method}. Ship to ${o.shippingAddress.city}.`, link: `/admin/orders/${o.id}` }),
    lowStock.length ? notifyOwner({ kind: "stock", title: "Low stock alert", body: lowStock.join(", "), link: "/admin/products?stock=low" }) : null,
    sendEmail({
      to: o.email,
      kind: "order",
      subject: `Order ${o.number} confirmed — Pure Crystal Hub`,
      link,
      html: emailLayout(
        "Thank you for your order",
        `<p>Dear ${escapeHtml(o.name)}, your crystals are being prepared with love.</p>
         <table width="100%" cellpadding="6" style="border-collapse:collapse">${rows}
         <tr><td><b>Total</b> (${method})</td><td align="right"><b>${inr(o.total)}</b></td></tr></table>
         <p><a href="${link}">Track your order &amp; download GST invoice</a></p>`,
      ),
    }),
    sendWhatsApp({ to: o.phone, kind: "order", text: `Thank you ${o.name}! Order ${o.number} (${inr(o.total)}) is confirmed. Track: ${link} — Pure Crystal Hub` }),
  ]);
}
