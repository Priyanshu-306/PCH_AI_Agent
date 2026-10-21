import { desc, eq } from "drizzle-orm";
import { MessageCircle, Phone } from "lucide-react";
import { db } from "@/db";
import { enquiries, services } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { setEnquiryStatus } from "@/app/admin/actions/healing";
import { Badge, Card, PageHeader, statusTone } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Enquiries" };

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff("enquiries");
  const status = ((await searchParams).status ?? "new") as "new" | "contacted" | "closed";
  const rows = await db.select({ e: enquiries, service: services.nameEn }).from(enquiries).leftJoin(services, eq(services.id, enquiries.serviceId)).where(eq(enquiries.status, status)).orderBy(desc(enquiries.createdAt));
  return (
    <>
      <PageHeader title="Enquiries" subtitle="Course enquiries and contact-form messages from both websites." />
      <div className="mb-4 flex gap-2 text-sm">
        {(["new", "contacted", "closed"] as const).map((s) => (
          <a key={s} href={`?status=${s}`} className={`rounded-full px-4 py-1.5 font-semibold capitalize ${s === status ? "bg-plum-700 text-white" : "bg-white text-plum-800 ring-1 ring-lavender-200"}`}>{s}</a>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map(({ e, service }) => (
          <Card key={e.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl text-sm">
                <p className="font-semibold text-plum-900">{e.name} <Badge tone="plum">{e.kind}</Badge> <Badge tone={statusTone(e.status)}>{e.status}</Badge></p>
                {service && <p className="mt-1 text-xs text-ink-soft">About: {service}</p>}
                {e.message && <p className="mt-2 whitespace-pre-line">{e.message}</p>}
                <p className="mt-2 flex flex-wrap gap-3 text-xs text-ink-soft">
                  {e.phone && <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1 text-plum-700"><Phone className="size-3.5" />{e.phone}</a>}
                  {e.phone && <a href={`https://wa.me/${e.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}`} className="inline-flex items-center gap-1 text-plum-700"><MessageCircle className="size-3.5" />WhatsApp</a>}
                  {e.email && <a href={`mailto:${e.email}`} className="text-plum-700">{e.email}</a>}
                  <span>{fmtDateTime(e.createdAt)} · {e.site}</span>
                </p>
              </div>
              <form action={setEnquiryStatus} className="flex gap-2">
                <input type="hidden" name="id" value={e.id} />
                {e.status !== "contacted" && <SubmitButton name="status" value="contacted" variant="ghost">Mark contacted</SubmitButton>}
                {e.status !== "closed" && <SubmitButton name="status" value="closed" variant="ghost">Close</SubmitButton>}
              </form>
            </div>
          </Card>
        ))}
        {!rows.length && <Card><p className="py-6 text-center text-sm text-ink-soft">No {status} enquiries.</p></Card>}
      </div>
    </>
  );
}
