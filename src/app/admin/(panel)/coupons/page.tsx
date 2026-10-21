import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDate, inr, istDay } from "@/lib/format";
import { deleteCoupon, saveCoupon } from "@/app/admin/actions/shop";
import { Badge, Card, Field, PageHeader, Table, input } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Coupons" };

type C = typeof coupons.$inferSelect;

function CouponFields({ c }: { c?: C }) {
  const d = (x: Date | null | undefined) => (x ? istDay(x) : "");
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Field label="Code"><input name="code" required defaultValue={c?.code} className={`${input} uppercase`} /></Field>
      <Field label="Type"><select name="type" defaultValue={c?.type ?? "percent"} className={input}><option value="percent">% off</option><option value="flat">₹ off</option></select></Field>
      <Field label="Value"><input name="value" type="number" step="0.01" required defaultValue={c ? Number(c.value) : ""} className={input} /></Field>
      <Field label="Min. order (₹)"><input name="minOrder" type="number" defaultValue={c ? Number(c.minOrder) : 0} className={input} /></Field>
      <Field label="Max discount (₹)"><input name="maxDiscount" type="number" defaultValue={c?.maxDiscount != null ? Number(c.maxDiscount) : ""} className={input} /></Field>
      <Field label="Usage limit"><input name="usageLimit" type="number" defaultValue={c?.usageLimit ?? ""} className={input} /></Field>
      <Field label="Starts"><input name="startsAt" type="date" defaultValue={d(c?.startsAt)} className={input} /></Field>
      <Field label="Ends"><input name="endsAt" type="date" defaultValue={d(c?.endsAt)} className={input} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-4"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} className="size-4 accent-[#5b3e8c]" /> Active</label>
    </div>
  );
}

export default async function Coupons() {
  await requireStaff("coupons");
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return (
    <>
      <PageHeader title="Coupons" subtitle="Discount codes customers can apply in the cart." />
      <Card title="New coupon" className="mb-6">
        <form action={saveCoupon} className="space-y-4"><CouponFields /><SubmitButton>Create coupon</SubmitButton></form>
      </Card>
      <Card pad={false}>
        <Table head={["Code", "Discount", "Rules", "Used", "Status", ""]}>
          {rows.map((c) => (
            <tr key={c.id}>
              <td className="font-mono font-bold text-plum-800">{c.code}</td>
              <td>{c.type === "percent" ? `${Number(c.value)}%` : inr(c.value)}{c.maxDiscount ? <span className="block text-xs text-ink-soft">max {inr(c.maxDiscount)}</span> : null}</td>
              <td className="text-xs text-ink-soft">Min {inr(c.minOrder)}{c.endsAt ? ` · ends ${fmtDate(c.endsAt)}` : ""}</td>
              <td className="tabular-nums">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
              <td><Badge tone={c.active ? "green" : "gray"}>{c.active ? "active" : "off"}</Badge></td>
              <td>
                <details>
                  <summary className="cursor-pointer text-xs font-semibold text-plum-700">Edit</summary>
                  <div className="mt-3 w-[min(80vw,720px)] rounded-xl border border-lavender-200 p-4">
                    <form action={saveCoupon} className="space-y-3"><input type="hidden" name="id" value={c.id} /><CouponFields c={c} /><SubmitButton>Save</SubmitButton></form>
                    <form action={deleteCoupon} className="mt-2"><input type="hidden" name="id" value={c.id} /><SubmitButton variant="danger">Delete</SubmitButton></form>
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
