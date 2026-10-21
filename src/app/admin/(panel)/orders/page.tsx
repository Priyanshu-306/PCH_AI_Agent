import Link from "next/link";
import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime, inr } from "@/lib/format";
import { Badge, Btn, Card, Filters, PageHeader, Pager, Table, input, statusTone } from "@/components/admin/ui";

export const metadata = { title: "Orders" };
const PER = 30;

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("orders");
  const sp = await searchParams;
  const where: SQL[] = [];
  if (sp.q) where.push(or(ilike(orders.number, `%${sp.q}%`), ilike(orders.name, `%${sp.q}%`), ilike(orders.phone, `%${sp.q}%`), ilike(orders.email, `%${sp.q}%`))!);
  if (sp.status === "open") where.push(inArray(orders.status, ["new", "confirmed", "packed"]));
  else if (sp.status) where.push(eq(orders.status, sp.status as "new"));
  if (sp.payment) where.push(eq(orders.paymentMethod, sp.payment as "cod"));
  const page = Math.max(1, Number(sp.page ?? 1));
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(orders).where(and(...where)).orderBy(desc(orders.createdAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(orders).where(and(...where)),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Orders" subtitle={`${n} order${n === 1 ? "" : "s"}`} />
      <Filters>
        <input name="q" defaultValue={sp.q} placeholder="Order no., name, phone, email" className={`${input} max-w-xs`} />
        <select name="status" defaultValue={sp.status ?? ""} className={`${input} w-auto`}>
          <option value="">All statuses</option><option value="open">To fulfil</option>
          {["new", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="payment" defaultValue={sp.payment ?? ""} className={`${input} w-auto`}>
          <option value="">Any payment</option><option value="razorpay">Online</option><option value="cod">COD</option><option value="whatsapp">WhatsApp</option>
        </select>
        <Btn variant="ghost">Apply</Btn>
      </Filters>
      <Card pad={false}>
        <Table head={["Order", "Customer", "Date", "Total", "Payment", "Status"]} empty="No orders match.">
          {rows.map((o) => (
            <tr key={o.id} className="hover:bg-lavender-50/50">
              <td><Link href={`/admin/orders/${o.id}`} className="font-semibold text-plum-800 hover:underline">{o.number}</Link></td>
              <td>{o.name}<span className="block text-xs text-ink-soft">{o.phone} · {o.shippingAddress.city}</span></td>
              <td className="text-xs whitespace-nowrap">{fmtDateTime(o.createdAt)}</td>
              <td className="font-semibold tabular-nums">{inr(o.total)}</td>
              <td><span className="text-xs uppercase">{o.paymentMethod}</span> <Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
              <td><Badge tone={statusTone(o.status)}>{o.status}</Badge></td>
            </tr>
          ))}
        </Table>
        <Pager page={page} pages={Math.ceil(n / PER)} base={`/admin/orders${qs ? `?${qs}` : ""}`} />
      </Card>
    </>
  );
}
