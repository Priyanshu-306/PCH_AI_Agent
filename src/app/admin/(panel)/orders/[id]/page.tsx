import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { FileText, MessageCircle } from "lucide-react";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime, inr } from "@/lib/format";
import { updateOrder } from "@/app/admin/actions/shop";
import { Badge, Btn, Card, Field, PageHeader, input, statusTone } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Order" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("orders");
  const [o] = await db.select().from(orders).where(eq(orders.id, Number((await params).id)));
  if (!o) notFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  const a = o.shippingAddress;
  return (
    <>
      <PageHeader
        title={`Order ${o.number}`}
        subtitle={`${fmtDateTime(o.createdAt)} · ${o.paymentMethod.toUpperCase()}`}
        actions={<>
          <Btn href={`/api/invoice/${o.number}`} variant="ghost"><FileText className="size-4" />GST invoice</Btn>
          <Btn href={`https://wa.me/${o.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} variant="ghost"><MessageCircle className="size-4" />WhatsApp customer</Btn>
        </>}
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Items" pad={false}>
            <ul className="divide-y divide-lavender-100 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 px-5 py-3"><span>{i.name} <span className="text-ink-soft">× {i.qty}</span><span className="block font-mono text-xs text-mist">{i.sku} · GST {Number(i.gstPercent)}%</span></span><span className="tabular-nums">{inr(Number(i.unitPrice) * i.qty)}</span></li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-lavender-100 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
              {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {o.couponCode}</dt><dd>−{inr(o.discount, { decimals: true })}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{inr(o.shipping)}</dd></div>
              {Number(o.codFee) > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(o.codFee)}</dd></div>}
              <div className="flex justify-between text-xs text-ink-soft"><dt>GST included</dt><dd>{inr(o.gstTotal, { decimals: true })}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{inr(o.total, { decimals: true })}</dd></div>
            </dl>
          </Card>
          <Card title="Customer & delivery">
            <p className="text-sm leading-relaxed"><b>{a.name}</b> · {a.phone} · {o.email}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}</p>
            {o.razorpayPaymentId && <p className="mt-3 font-mono text-xs text-ink-soft">Razorpay payment {o.razorpayPaymentId}</p>}
          </Card>
        </div>
        <Card title="Update order">
          <form action={updateOrder} className="space-y-4">
            <input type="hidden" name="id" value={o.id} />
            <p className="flex gap-2"><Badge tone={statusTone(o.status)}>{o.status}</Badge><Badge tone={statusTone(o.paymentStatus)}>payment {o.paymentStatus}</Badge></p>
            <Field label="Order status">
              <select name="status" defaultValue={o.status} className={input}>{["new", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Payment status">
              <select name="paymentStatus" defaultValue={o.paymentStatus} className={input}>{["pending", "paid", "failed", "refunded"].map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Courier"><input name="courier" defaultValue={o.courier ?? ""} placeholder="Delhivery, India Post…" className={input} /></Field>
              <Field label="Tracking no."><input name="trackingNumber" defaultValue={o.trackingNumber ?? ""} className={input} /></Field>
            </div>
            <Field label="Internal notes"><textarea name="notes" rows={3} defaultValue={o.notes ?? ""} className={input} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[#5b3e8c]" /> Email & WhatsApp the customer about status changes</label>
            <SubmitButton>Save</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
