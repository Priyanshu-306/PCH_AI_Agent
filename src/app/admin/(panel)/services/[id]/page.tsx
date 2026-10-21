import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { courseBatches, services } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDate, inr } from "@/lib/format";
import { HEALING_URL } from "@/lib/site";
import { deleteBatch, saveBatch } from "@/app/admin/actions/healing";
import { Btn, Card, PageHeader, Table, input } from "@/components/admin/ui";
import ServiceForm from "@/components/admin/ServiceForm";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Edit service" };

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("services");
  const [s] = await db.select().from(services).where(eq(services.id, Number((await params).id)));
  if (!s) notFound();
  const batches = await db.select().from(courseBatches).where(eq(courseBatches.serviceId, s.id)).orderBy(asc(courseBatches.startsOn));
  const url = `${HEALING_URL}/${s.type === "session" ? "services" : "courses"}/${s.slug}`;
  return (
    <>
      <PageHeader title={s.nameEn} subtitle={`${s.type} · ${s.code}`} actions={<Btn href={url} variant="ghost"><ExternalLink className="size-4" />View on site</Btn>} />
      <ServiceForm s={s} />
      {s.type !== "session" && (
        <Card title="Batches / dates" className="mt-8" pad={false}>
          <div id="batches" />
          <Table head={["Dates", "Timing", "Location", "Seats", "Fee", ""]} empty="No dates scheduled — add one below.">
            {batches.map((b) => (
              <tr key={b.id}>
                <td>{fmtDate(b.startsOn)}{b.endsOn ? ` – ${fmtDate(b.endsOn)}` : ""}</td>
                <td>{b.timing}</td>
                <td>{b.location} <span className="text-xs text-ink-soft">({b.mode})</span></td>
                <td>{b.seats ?? "—"}</td>
                <td>{b.fee ? inr(b.fee) : "—"}</td>
                <td><form action={deleteBatch}><input type="hidden" name="id" value={b.id} /><SubmitButton variant="danger">Remove</SubmitButton></form></td>
              </tr>
            ))}
          </Table>
          <form action={saveBatch} className="grid gap-2 border-t border-lavender-100 p-5 sm:grid-cols-4 lg:grid-cols-8">
            <input type="hidden" name="serviceId" value={s.id} />
            <input name="startsOn" type="date" required className={input} aria-label="Starts on" />
            <input name="endsOn" type="date" className={input} aria-label="Ends on" />
            <input name="timing" placeholder="09:00 AM – 06:00 PM" className={input} />
            <input name="location" placeholder="Lucknow / Zoom" className={input} />
            <select name="mode" className={input} defaultValue="onsite"><option value="onsite">In person</option><option value="online">Online</option></select>
            <input name="seats" type="number" placeholder="Seats" className={input} />
            <input name="fee" type="number" placeholder="Fee ₹" className={input} />
            <SubmitButton>Add date</SubmitButton>
          </form>
        </Card>
      )}
    </>
  );
}
