import { asc, gte } from "drizzle-orm";
import { db } from "@/db";
import { availability, blockedDates } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDate, istDay } from "@/lib/format";
import { blockDate, saveAvailability, unblockDate } from "@/app/admin/actions/healing";
import { Card, PageHeader, input } from "@/components/admin/ui";
import AvailabilityEditor from "@/components/admin/AvailabilityEditor";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Availability" };

export default async function Availability() {
  await requireStaff("bookings");
  const [windows, blocked] = await Promise.all([
    db.select().from(availability).orderBy(asc(availability.weekday), asc(availability.startTime)),
    db.select().from(blockedDates).where(gte(blockedDates.day, istDay())).orderBy(asc(blockedDates.day)),
  ]);
  return (
    <>
      <PageHeader title="Availability" subtitle="Weekly hours when clients can book sessions online (IST). Slot spacing and notice period are in Settings › Booking." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Weekly hours">
          <form action={saveAvailability}>
            <AvailabilityEditor initial={windows.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }))} />
            <div className="mt-4"><SubmitButton>Save weekly hours</SubmitButton></div>
          </form>
        </Card>
        <Card title="Holidays & blocked dates">
          <form action={blockDate} className="flex flex-wrap gap-2">
            <input name="day" type="date" required min={istDay()} className={`${input} w-auto`} aria-label="Date" />
            <input name="reason" placeholder="Reason (optional)" className={`${input} flex-1`} />
            <SubmitButton>Block</SubmitButton>
          </form>
          <ul className="mt-4 divide-y divide-lavender-100 text-sm">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span><b>{fmtDate(b.day)}</b> {b.reason && <span className="text-ink-soft">· {b.reason}</span>}</span>
                <form action={unblockDate}><input type="hidden" name="id" value={b.id} /><SubmitButton variant="ghost">Re-open</SubmitButton></form>
              </li>
            ))}
            {!blocked.length && <li className="py-4 text-ink-soft">No upcoming blocked dates.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
