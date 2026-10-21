import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { coupons, products } from "@/db/schema";
import { getSetting } from "./settings";

export type CartLine = { productId: number; qty: number };
export type PaymentMethod = "razorpay" | "cod" | "whatsapp";

export const unitPrice = (p: { mrp: number; salePrice: number | null }) =>
  p.salePrice != null && Number(p.salePrice) > 0 && Number(p.salePrice) < Number(p.mrp) ? Number(p.salePrice) : Number(p.mrp);

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function validateCoupon(code: string | null | undefined, subtotal: number) {
  if (!code) return { coupon: null, discount: 0, error: null as string | null };
  const [c] = await db.select().from(coupons).where(and(eq(coupons.code, code.trim().toUpperCase()), eq(coupons.active, true)));
  const now = new Date();
  if (!c) return { coupon: null, discount: 0, error: "Invalid coupon code" };
  if (c.startsAt && c.startsAt > now) return { coupon: null, discount: 0, error: "This coupon is not active yet" };
  if (c.endsAt && c.endsAt < now) return { coupon: null, discount: 0, error: "This coupon has expired" };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { coupon: null, discount: 0, error: "This coupon has reached its limit" };
  if (subtotal < Number(c.minOrder)) return { coupon: null, discount: 0, error: `Minimum order ₹${Number(c.minOrder)} for this coupon` };
  let discount = c.type === "percent" ? (subtotal * Number(c.value)) / 100 : Number(c.value);
  if (c.maxDiscount != null) discount = Math.min(discount, Number(c.maxDiscount));
  return { coupon: c, discount: round2(Math.min(discount, subtotal)), error: null };
}

/**
 * Prices are GST-inclusive (Indian retail MRP convention). GST is extracted per line after
 * spreading the coupon discount proportionally, which is what the tax invoice shows.
 */
export async function priceCart(lines: CartLine[], couponCode?: string | null, method: PaymentMethod = "razorpay") {
  const merged = new Map<number, number>();
  for (const l of lines) if (l.qty > 0) merged.set(l.productId, (merged.get(l.productId) ?? 0) + Math.min(99, Math.floor(l.qty)));
  const ids = [...merged.keys()];
  const rows = ids.length ? await db.select().from(products).where(inArray(products.id, ids)) : [];
  const shipping = await getSetting("shipping");

  const problems: string[] = [];
  const items = rows
    .filter((p) => {
      if (p.status !== "active") {
        problems.push(`${p.nameEn} is no longer available`);
        return false;
      }
      return true;
    })
    .map((p) => {
      let qty = merged.get(p.id)!;
      if (qty > p.stockQty) {
        problems.push(p.stockQty ? `Only ${p.stockQty} × ${p.nameEn} in stock` : `${p.nameEn} is out of stock`);
        qty = p.stockQty;
      }
      const price = unitPrice(p);
      return { product: p, qty, unitPrice: price, lineTotal: round2(price * qty) };
    })
    .filter((i) => i.qty > 0);

  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  const { coupon, discount, error: couponError } = await validateCoupon(couponCode, subtotal);
  const afterDiscount = subtotal - discount;
  const shippingFee = items.length === 0 || afterDiscount >= shipping.freeAbove ? 0 : shipping.flatRate;
  const codFee = method === "cod" && items.length ? shipping.codFee : 0;
  const gstTotal = round2(
    items.reduce((s, i) => {
      const share = subtotal ? i.lineTotal - (discount * i.lineTotal) / subtotal : 0;
      const g = Number(i.product.gstPercent);
      return s + (share * g) / (100 + g);
    }, 0),
  );
  const total = round2(afterDiscount + shippingFee + codFee);
  const codAllowed = shipping.codEnabled && total <= shipping.codMaxOrder;

  return { items, subtotal, discount, coupon, couponError, shipping: shippingFee, codFee, gstTotal, total, problems, codAllowed, shippingSettings: shipping };
}
