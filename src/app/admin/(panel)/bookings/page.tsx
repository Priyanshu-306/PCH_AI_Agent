import Link from "next/link";
import { and, asc, desc, eq, gte, ilike, lt, or, sql, type SQL } from "drizzle-orm";
import { CalendarCog } from "lucide-react";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime, inr } from "@/lib/format";
import { Badge, Btn, Card, Filters, PageHeader, Pager, Table, input, statusTone } from "@/components/admin/ui";

export const metadata = { title: "Bookings" };
const PER = 30;

export default async function BookingsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("bookings");
  const sp = await searchParams;
  const when = sp.when ?? "upcoming";
  const now = new Date();
  const where: SQL[] = [when === "past" ? lt(bookings.startsAt, now) : gte(bookings.startsAt, now)];
  if (sp.status) where.push(eq(bookings.status, sp.status as "pending"));
  if (sp.q) where.push(or(ilike(bookings.name, `%${sp.q}%`), ilike(bookings.phone, `%${sp.q}%`), ilike(bookings.number, `%${sp.q}%`), ilike(bookings.email, `%${sp.q}%`))!);
  const page = Math.max(1, Number(sp.page ?? 1));
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(bookings).where(and(...where)).orderBy(when === "past" ? desc(bookings.startsAt) : asc(bookings.startsAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(bookings).where(and(...where)),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Bookings" subtitle="Healing sessions booked online." actions={<Btn href="/admin/bookings/availability" variant="ghost"><CalendarCog className="size-4" />Availability & holidays</Btn>} />
      <Filters>
        <select name="when" defaultValue={when} className={`${input} w-auto`}><option value="upcoming">Upcoming</option><option value="past">Past</option></select>
        <select name="status" defaultValue={sp.status ?? ""} className={`${input} w-auto`}><option value="">Any status</option>{["pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => <option key={s}>{s}</option>)}</select>
        <input name="q" defaultValue={sp.q} placeholder="Name, phone, reference" className={`${input} max-w-xs`} />
        <Btn variant="ghost">Apply</Btn>
      </Filters>
      <Card pad={false}>
        <Table head={["When (IST)", "Client", "Service", "Mode", "Paid", "Status"]} empty="No bookings.">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-lavender-50/50">
              <td className="whitespace-nowrap"><Link href={`/admin/bookings/${b.id}`} className="font-semibold text-plum-800 hover:underline">{fmtDateTime(b.startsAt)}</Link></td>
              <td>{b.name}<span className="block text-xs text-ink-soft">{b.phone}</span></td>
              <td>{b.serviceName}</td>
              <td className="capitalize">{b.mode}</td>
              <td className="tabular-nums">{inr(b.price)} <Badge tone={statusTone(b.paymentStatus)}>{b.paymentStatus}</Badge></td>
              <td><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
            </tr>
          ))}
        </Table>
        <Pager page={page} pages={Math.ceil(n / PER)} base={`/admin/bookings${qs ? `?${qs}` : ""}`} />
      </Card>
    </>
  );
}
