import { asc } from "drizzle-orm";
import { db } from "@/db";
import { trainers, type services } from "@/db/schema";
import { saveService, deleteService } from "@/app/admin/actions/healing";
import { Card, Field, input } from "./ui";
import { MediaField } from "./MediaPicker";
import SubmitButton from "./SubmitButton";

type S = typeof services.$inferSelect;

export default async function ServiceForm({ s }: { s?: S }) {
  const tr = await db.select().from(trainers).orderBy(asc(trainers.sort));
  return (
    <>
      <form action={saveService} className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {s && <input type="hidden" name="id" value={s.id} />}
        <div className="space-y-6">
          <Card title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (English) *"><input name="nameEn" required defaultValue={s?.nameEn} className={input} /></Field>
              <Field label="Name (Hindi)"><input name="nameHi" defaultValue={s?.nameHi ?? ""} className={input} /></Field>
              <Field label="Short description (English)" className="sm:col-span-2"><textarea name="shortEn" rows={2} defaultValue={s?.shortEn} className={input} /></Field>
              <Field label="Short description (Hindi)" className="sm:col-span-2"><textarea name="shortHi" rows={2} defaultValue={s?.shortHi ?? ""} className={input} /></Field>
              <Field label="Full description (English)" hint="Blank lines start new paragraphs" className="sm:col-span-2"><textarea name="descriptionEn" rows={6} defaultValue={s?.descriptionEn} className={input} /></Field>
              <Field label="Full description (Hindi)" className="sm:col-span-2"><textarea name="descriptionHi" rows={5} defaultValue={s?.descriptionHi ?? ""} className={input} /></Field>
              <Field label="Helps with" hint="Comma separated" className="sm:col-span-2"><input name="helpsWith" defaultValue={s?.helpsWith} className={input} /></Field>
            </div>
          </Card>
          <Card title="Media">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Image"><MediaField name="image" kind="image" defaultValue={s?.image ?? ""} /></Field>
              <Field label="Video"><MediaField name="video" kind="video" defaultValue={s?.video ?? ""} /></Field>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Settings">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Code *" hint="Used by Excel import"><input name="code" required defaultValue={s?.code} className={input} /></Field>
              <Field label="Type">
                <select name="type" defaultValue={s?.type ?? "session"} className={input}>{["session", "course", "webinar", "workshop"].map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
              <Field label="Duration (minutes)"><input name="durationMinutes" type="number" min={0} defaultValue={s?.durationMinutes ?? ""} className={input} /></Field>
              <Field label="Price (₹)" hint="Blank = price on request"><input name="price" type="number" min={0} step="0.01" defaultValue={s?.price != null ? Number(s.price) : ""} className={input} /></Field>
              <Field label="Mode">
                <select name="mode" defaultValue={s?.mode ?? "both"} className={input}><option value="both">Online & in person</option><option value="online">Online</option><option value="onsite">In person</option></select>
              </Field>
              <Field label="Trainer">
                <select name="trainerId" defaultValue={s?.trainerId ?? ""} className={input}><option value="">—</option>{tr.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              </Field>
              <Field label="Accent colour"><input name="accent" type="color" defaultValue={s?.accent ?? "#9b7fd4"} className="h-10 w-full rounded-xl border border-lavender-200" /></Field>
              <Field label="Sort order"><input name="sort" type="number" defaultValue={s?.sort ?? 0} className={input} /></Field>
              <Field label="URL slug" className="col-span-2"><input name="slug" defaultValue={s?.slug} className={input} /></Field>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="bookableOnline" defaultChecked={s?.bookableOnline ?? true} className="size-4 accent-[#5b3e8c]" /> Bookable online with calendar + payment (sessions)</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="size-4 accent-[#5b3e8c]" /> Visible on website</label>
            </div>
          </Card>
          <SubmitButton>{s ? "Save changes" : "Create"}</SubmitButton>
        </div>
      </form>
      {s && (
        <form action={deleteService} className="mt-4"><input type="hidden" name="id" value={s.id} /><SubmitButton variant="danger">Delete</SubmitButton></form>
      )}
    </>
  );
}
