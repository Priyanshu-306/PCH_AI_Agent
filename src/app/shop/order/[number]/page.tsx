import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CheckCircle2, Clock, FileText, Package, Truck } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { getCustomer } from "@/lib/auth";
import { accessToken } from "@/lib/checkout";
import { fmtDateTime, inr } from "@/lib/format";

export const metadata = { title: "Your order", robots: { index: false } };

const STEPS = ["confirmed", "packed", "shipped", "delivered"] as const;

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params;
  const token = (await searchParams).t;
  const [o] = await db.select().from(orders).where(eq(orders.number, number));
  if (!o) notFound();
  const customer = await getCustomer();
  if (token !== accessToken(number) && !(customer && o.customerId === customer.id)) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  const { t } = await getDict();
  const step = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const pendingPay = o.paymentMethod === "razorpay" && o.paymentStatus !== "paid";

  return (
    <section className="pt-36 pb-10">
      <div className="container-x max-w-3xl">
        <div className="rounded-[28px] border border-white/10 bg-night-800/70 p-6 sm:p-10">
          {o.status === "cancelled" ? null : pendingPay ? <Clock className="size-10 text-gold-300" /> : <CheckCircle2 className="size-10 text-emerald-300" />}
          <h1 className="mt-4 font-carved text-4xl">{o.status === "cancelled" ? "Order cancelled" : pendingPay ? "Awaiting payment" : t.shop.orderPlaced}</h1>
          <p className="mt-2 text-crystal/65">{t.shop.orderRef}: <b className="text-crystal">{o.number}</b> · {fmtDateTime(o.createdAt)}</p>

          {o.status !== "cancelled" && !pendingPay && (
            <ol className="mt-8 grid grid-cols-4 gap-2 text-center text-xs">
              {STEPS.map((s, i) => (
                <li key={s} className={i <= step ? "text-gold-300" : "text-crystal/35"}>
                  <span className={`mx-auto mb-2 grid size-9 place-items-center rounded-full border ${i <= step ? "border-gold-400 bg-gold-400/15" : "border-white/15"}`}>
                    {i < 2 ? <Package className="size-4" /> : <Truck className="size-4" />}
                  </span>
                  {s[0].toUpperCase() + s.slice(1)}
                </li>
              ))}
            </ol>
          )}
          {o.trackingNumber && <p className="mt-6 rounded-2xl bg-amethyst-500/10 p-4 text-sm">Tracking: <b>{o.courier} {o.trackingNumber}</b></p>}

          <ul className="mt-8 divide-y divide-white/10 border-y border-white/10 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between py-3"><span>{i.name} × {i.qty}</span><span>{inr(Number(i.unitPrice) * i.qty)}</span></li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 text-sm">
            {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-300"><dt>{t.shop.discount}</dt><dd>−{inr(o.discount, { decimals: true })}</dd></div>}
            <div className="flex justify-between"><dt className="text-crystal/60">{t.shop.shipping}</dt><dd>{Number(o.shipping) ? inr(o.shipping) : t.shop.free}</dd></div>
            {Number(o.codFee) > 0 && <div className="flex justify-between"><dt className="text-crystal/60">{t.shop.codFee}</dt><dd>{inr(o.codFee)}</dd></div>}
            <div className="flex justify-between text-lg font-bold"><dt>{t.shop.total}</dt><dd>{inr(o.total, { decimals: Number(o.total) % 1 !== 0 })}</dd></div>
          </dl>
          <p className="mt-6 text-sm text-crystal/60">{o.shippingAddress.name}, {o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!pendingPay && <a href={`/api/invoice/${o.number}?t=${accessToken(o.number)}`} target="_blank" className="btn btn-ghost-dark"><FileText className="size-4" />{t.shop.invoice}</a>}
            <Link href="/products" className="btn btn-gold">{t.shop.continueShopping}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
