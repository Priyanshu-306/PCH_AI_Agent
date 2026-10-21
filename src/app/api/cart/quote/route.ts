import { z } from "zod";
import { priceCart } from "@/lib/pricing";
import { razorpayLive, testPaymentsAllowed } from "@/lib/payments";

const Body = z.object({
  items: z.array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(99) })),
  coupon: z.string().max(40).optional().nullable(),
  method: z.enum(["razorpay", "cod", "whatsapp"]).default("razorpay"),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid cart" }, { status: 400 });
  const q = await priceCart(parsed.data.items, parsed.data.coupon, parsed.data.method);
  return Response.json({
    items: q.items.map((i) => ({
      productId: i.product.id,
      slug: i.product.slug,
      name: i.product.nameEn,
      nameHi: i.product.nameHi,
      crystals: i.product.crystals,
      image: i.product.images[0] ?? null,
      qty: i.qty,
      stock: i.product.stockQty,
      unitPrice: i.unitPrice,
      mrp: Number(i.product.mrp),
      lineTotal: i.lineTotal,
    })),
    subtotal: q.subtotal,
    discount: q.discount,
    coupon: q.coupon?.code ?? null,
    couponError: q.couponError,
    shipping: q.shipping,
    codFee: q.codFee,
    gstTotal: q.gstTotal,
    total: q.total,
    problems: q.problems,
    codAllowed: q.codAllowed,
    whatsappEnabled: q.shippingSettings.whatsappOrderEnabled,
    onlineEnabled: razorpayLive() || testPaymentsAllowed(),
    freeAbove: q.shippingSettings.freeAbove,
  });
}
