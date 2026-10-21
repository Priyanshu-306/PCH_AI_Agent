import Link from "next/link";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { contentBlocks } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { CONTENT } from "@/lib/content-registry";
import { HEALING_URL, SHOP_URL } from "@/lib/site";
import { saveContent } from "@/app/admin/actions/system";
import { Btn, Card, Field, PageHeader, input } from "@/components/admin/ui";
import { MediaField } from "@/components/admin/MediaPicker";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Content editor" };

export default async function ContentEditor({ searchParams }: { searchParams: Promise<{ site?: string; section?: string }> }) {
  await requireStaff("content");
  const sp = await searchParams;
  const site = sp.site === "shop" ? "shop" : "healing";
  const defs = CONTENT.filter((c) => c.site === site);
  const sections = [...new Set(defs.map((d) => d.section))];
  const section = sections.includes(sp.section ?? "") ? sp.section! : sections[0];
  const rows = await db.select().from(contentBlocks).where(eq(contentBlocks.site, site));
  const value = (key: string) => rows.find((r) => r.key === key);
  const fields = defs.filter((d) => d.section === section);

  return (
    <>
      <PageHeader title="Content editor" subtitle="Edit text, photos and videos on both websites — in English and Hindi. Changes go live as soon as you save." actions={<Btn href={site === "shop" ? SHOP_URL : HEALING_URL} variant="ghost"><ExternalLink className="size-4" />Open site</Btn>} />
      <div className="mb-4 flex gap-2 text-sm">
        {(["healing", "shop"] as const).map((s) => (
          <Link key={s} href={`?site=${s}`} className={`rounded-full px-4 py-1.5 font-semibold ${s === site ? "bg-plum-700 text-white" : "bg-white text-plum-800 ring-1 ring-lavender-200"}`}>{s === "healing" ? "Pure Conscious Healing" : "Pure Crystal Hub"}</Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Sections">
          {sections.map((s) => (
            <Link key={s} href={`?site=${site}&section=${encodeURIComponent(s)}`} className={`rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap ${s === section ? "bg-lavender-100 text-plum-800" : "text-ink-soft hover:bg-white"}`}>{s}</Link>
          ))}
        </nav>
        <Card title={section}>
          <form action={saveContent} className="space-y-6">
            <input type="hidden" name="site" value={site} />
            <input type="hidden" name="section" value={section} />
            {fields.map((f) => {
              const row = value(f.key);
              const en = row?.valueEn ?? f.en;
              const hi = row ? row.valueHi ?? "" : f.hi ?? "";
              if (f.kind === "image" || f.kind === "video")
                return <Field key={f.key} label={f.label}><MediaField name={`${f.key}::en`} kind={f.kind} defaultValue={en} /></Field>;
              const Tag = f.kind === "longtext" ? "textarea" : "input";
              return (
                <div key={f.key} className="grid gap-3 md:grid-cols-2">
                  <Field label={`${f.label} · English`}><Tag name={`${f.key}::en`} defaultValue={en} rows={f.kind === "longtext" ? 5 : undefined} className={input} /></Field>
                  <Field label={`${f.label} · हिन्दी`}><Tag name={`${f.key}::hi`} defaultValue={hi} rows={f.kind === "longtext" ? 5 : undefined} className={input} lang="hi" /></Field>
                </div>
              );
            })}
            <SubmitButton>Save section</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}
