import { asc } from "drizzle-orm";
import { db } from "@/db";
import { trainers } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { deleteTrainer, saveTrainer } from "@/app/admin/actions/healing";
import { Badge, Card, Field, PageHeader, input } from "@/components/admin/ui";
import { MediaField } from "@/components/admin/MediaPicker";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Trainers" };
type T = typeof trainers.$inferSelect;

function TrainerFields({ t }: { t?: T }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Name *"><input name="name" required defaultValue={t?.name} className={input} /></Field>
      <Field label="Photo"><MediaField name="photo" kind="image" defaultValue={t?.photo ?? ""} /></Field>
      <Field label="Title (English)"><input name="titleEn" defaultValue={t?.titleEn} className={input} /></Field>
      <Field label="Title (Hindi)"><input name="titleHi" defaultValue={t?.titleHi ?? ""} className={input} /></Field>
      <Field label="Bio (English)"><textarea name="bioEn" rows={4} defaultValue={t?.bioEn} className={input} /></Field>
      <Field label="Bio (Hindi)"><textarea name="bioHi" rows={4} defaultValue={t?.bioHi ?? ""} className={input} /></Field>
      <Field label="Credentials"><input name="credentials" defaultValue={t?.credentials} className={input} /></Field>
      <Field label="Sort order"><input name="sort" type="number" defaultValue={t?.sort ?? 0} className={input} /></Field>
      <div className="flex gap-5 text-sm sm:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="isFounder" defaultChecked={t?.isFounder} className="size-4 accent-[#5b3e8c]" /> Founder</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={t?.active ?? true} className="size-4 accent-[#5b3e8c]" /> Show on website</label>
      </div>
    </div>
  );
}

export default async function Trainers() {
  await requireStaff("trainers");
  const rows = await db.select().from(trainers).orderBy(asc(trainers.sort));
  return (
    <>
      <PageHeader title="Trainers" subtitle="Shown in “Our Trainers” and on the courses they teach." />
      <div className="space-y-4">
        {rows.map((t) => (
          <Card key={t.id}>
            <details>
              <summary className="flex cursor-pointer items-center gap-4">
                <span className="size-12 overflow-hidden rounded-xl bg-gradient-to-br from-lavender-300 to-gold-300">{t.photo && <img src={t.photo} alt="" className="size-full object-cover" />}</span>
                <span className="flex-1"><b className="text-plum-900">{t.name}</b><span className="block text-xs text-ink-soft">{t.titleEn}</span></span>
                {t.isFounder && <Badge tone="plum">founder</Badge>}
                <Badge tone={t.active ? "green" : "gray"}>{t.active ? "visible" : "hidden"}</Badge>
              </summary>
              <form action={saveTrainer} className="mt-5 space-y-4"><TrainerFields t={t} /><SubmitButton>Save</SubmitButton></form>
              <form action={deleteTrainer} className="mt-2"><input type="hidden" name="id" value={t.id} /><SubmitButton variant="danger">Delete</SubmitButton></form>
            </details>
          </Card>
        ))}
        <Card title="Add trainer">
          <form action={saveTrainer} className="space-y-4"><TrainerFields /><SubmitButton>Add trainer</SubmitButton></form>
        </Card>
      </div>
    </>
  );
}
