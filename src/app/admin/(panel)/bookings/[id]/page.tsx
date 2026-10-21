import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { MessageCircle } from "lucide-react";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime, inr } from "@/lib/format";
import { updateBooking } from "@/app/admin/actions/healing";
import { Badge, Btn, Card, Field, PageHeader, input, statusTone } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Booking" };

export default async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("bookings");
  const [b] = await db.select().from(bookings).where(eq(bookings.id, Number((await params).id)));
  if (!b) notFound();
  return (
    <>
      <PageHeader title={`${b.serviceName} · ${b.name}`} subtitle={`${b.number} · booked ${fmtDateTime(b.createdAt)}`} actions={<Btn href={`https://wa.me/${b.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} variant="ghost"><MessageCircle className="size-4" />WhatsApp client</Btn>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Session">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-ink-soft">When (IST)</dt><dd className="font-semibold">{fmtDateTime(b.startsAt)}</dd></div>
            <div><dt className="text-ink-soft">Mode</dt><dd className="font-semibold capitalize">{b.mode}</dd></div>
            <div><dt className="text-ink-soft">Fee</dt><dd className="font-semibold">{inr(b.price)} <Badge tone={statusTone(b.paymentStatus)}>{b.paymentStatus}</Badge></dd></div>
            <div><dt className="text-ink-soft">Status</dt><dd><Badge tone={statusTone(b.status)}>{b.status}</Badge></dd></div>
            <div><dt className="text-ink-soft">Email</dt><dd className="break-all">{b.email}</dd></div>
            <div><dt className="text-ink-soft">Phone</dt><dd>{b.phone}</dd></div>
          </dl>
          {b.concern && <div className="mt-4 rounded-xl bg-lavender-50 p-4 text-sm"><p className="mb-1 text-xs font-semibold text-ink-soft">Client shared</p>{b.concern}</div>}
          {b.razorpayPaymentId && <p className="mt-3 font-mono text-xs text-ink-soft">Razorpay {b.razorpayPaymentId}</p>}
        </Card>
        <Card title="Update">
          <form action={updateBooking} className="space-y-4">
            <input type="hidden" name="id" value={b.id} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Status"><select name="status" defaultValue={b.status} className={input}>{["pending", "confirmed", "completed", "cancelled", "no_show"].map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Payment"><select name="paymentStatus" defaultValue={b.paymentStatus} className={input}>{["pending", "paid", "failed", "refunded"].map((s) => <option key={s}>{s}</option>)}</select></Field>
            </div>
            {b.mode === "online" && <Field label="Send meeting link" hint="Emails & WhatsApps the link to the client when saved"><input name="meetingLink" placeholder="https://meet.google.com/…" className={input} /></Field>}
            <Field label="Private session notes" hint="Only visible to staff"><textarea name="adminNotes" rows={5} defaultValue={b.adminNotes ?? ""} className={input} /></Field>
            <SubmitButton>Save</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
