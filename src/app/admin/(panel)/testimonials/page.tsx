import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { services, testimonials } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { deleteTestimonial, saveTestimonial } from "@/app/admin/actions/healing";
import { Badge, Card, Field, PageHeader, input } from "@/components/admin/ui";
import { MediaField } from "@/components/admin/MediaPicker";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Testimonials" };
type T = typeof testimonials.$inferSelect;

function Fields({ t, svc }: { t?: T; svc: { id: number; nameEn: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Client name *" hint="Use first name or initials if preferred"><input name="name" required defaultValue={t?.name} className={input} /></Field>
      <Field label="Location"><input name="location" defaultValue={t?.location ?? ""} className={input} /></Field>
      <Field label="Testimonial (English) *" className="sm:col-span-2"><textarea name="textEn" rows={3} required defaultValue={t?.textEn} className={input} /></Field>
      <Field label="Testimonial (Hindi)" className="sm:col-span-2"><textarea name="textHi" rows={3} defaultValue={t?.textHi ?? ""} className={input} /></Field>
      <Field label="Website"><select name="site" defaultValue={t?.site ?? "healing"} className={input}><option value="healing">Pure Conscious Healing</option><option value="shop">Pure Crystal Hub</option></select></Field>
      <Field label="Related service"><select name="serviceId" defaultValue={t?.serviceId ?? ""} className={input}><option value="">—</option>{svc.map((s) => <option key={s.id} value={s.id}>{s.nameEn}</option>)}</select></Field>
      <Field label="Rating"><select name="rating" defaultValue={t?.rating ?? 5} className={input}>{[5, 4, 3, 2, 1].map((r) => <option key={r}>{r}</option>)}</select></Field>
      <Field label="Photo (with permission)"><MediaField name="photo" kind="image" defaultValue={t?.photo ?? ""} /></Field>
      <div className="flex gap-5 text-sm sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={t?.featured ?? true} className="size-4 accent-[#5b3e8c]" /> Featured first</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={t?.active ?? true} className="size-4 accent-[#5b3e8c]" /> Visible</label>
      </div>
    </div>
  );
}

export default async function Testimonials() {
  await requireStaff("testimonials");
  const [rows, svc] = await Promise.all([db.select().from(testimonials).orderBy(desc(testimonials.createdAt)), db.select({ id: services.id, nameEn: services.nameEn }).from(services).orderBy(asc(services.sort))]);
  return (
    <>
      <PageHeader title="Testimonials" subtitle="Client stories shown on the healing website." />
      <div className="space-y-4">
        {rows.map((t) => (
          <Card key={t.id}>
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                <span className="flex-1 text-sm"><b className="text-plum-900">{t.name}</b>{t.location && <span className="text-ink-soft"> · {t.location}</span>}<span className="mt-1 block line-clamp-1 text-ink-soft">{t.textEn}</span></span>
                <Badge tone={t.active ? "green" : "gray"}>{t.active ? "visible" : "hidden"}</Badge>
              </summary>
              <form action={saveTestimonial} className="mt-5 space-y-4"><Fields t={t} svc={svc} /><SubmitButton>Save</SubmitButton></form>
              <form action={deleteTestimonial} className="mt-2"><input type="hidden" name="id" value={t.id} /><SubmitButton variant="danger">Delete</SubmitButton></form>
            </details>
          </Card>
        ))}
        <Card title="Add testimonial"><form action={saveTestimonial} className="space-y-4"><Fields svc={svc} /><SubmitButton>Add</SubmitButton></form></Card>
      </div>
    </>
  );
}
