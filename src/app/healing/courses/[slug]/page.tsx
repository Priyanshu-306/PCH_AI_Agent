import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Clock, IndianRupee, MapPin, Users } from "lucide-react";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { serviceBySlug, upcomingBatches } from "@/lib/queries";
import { fmtDate, inr, splitList } from "@/lib/format";
import Reveal from "@/components/common/Reveal";
import EnquiryForm from "@/components/healing/EnquiryForm";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await serviceBySlug((await params).slug);
  return s ? { title: s.nameEn, description: s.shortEn } : {};
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = await serviceBySlug((await params).slug);
  if (!s || s.type === "session") notFound();
  const { lang, t } = await getDict();
  const batches = await upcomingBatches([s.id]);
  return (
    <section data-scene="page" className="pt-36 pb-10 sm:pt-44">
      <div className="container-x grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Reveal><span className="eyebrow" style={{ color: s.accent }}>{s.type}</span></Reveal>
          <Reveal delay={100}><h1 className="mt-4 font-display text-5xl leading-[1.04] font-light text-plum-900 sm:text-6xl">{pick(s, "name", lang)}</h1></Reveal>
          <Reveal delay={200}><p className="mt-6 text-xl text-ink-soft">{pick(s, "short", lang)}</p></Reveal>
          <Reveal delay={250} className="prose-soft mt-8 text-lg leading-relaxed">
            {pick(s, "description", lang).split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </Reveal>
          {splitList(s.helpsWith).length > 0 && (
            <Reveal delay={300} className="mt-8 flex flex-wrap gap-2">
              {splitList(s.helpsWith).map((h) => <span key={h} className="glass rounded-full px-4 py-2 text-sm font-medium text-plum-800">{h}</span>)}
            </Reveal>
          )}
          {s.trainer && (
            <Reveal delay={350} className="glass mt-10 flex items-center gap-4 rounded-3xl p-5">
              <span className="grid size-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-lavender-300 to-gold-300 font-display text-2xl text-white">
                {s.trainer.photo ? <img src={s.trainer.photo} alt="" className="size-full object-cover" /> : s.trainer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <span>
                <span className="block text-xs font-semibold tracking-wider text-mist uppercase">{t.healing.trainer}</span>
                <span className="block font-display text-2xl text-plum-900">{s.trainer.name}</span>
                <span className="block text-sm text-gold-600">{pick(s.trainer, "title", lang)}</span>
              </span>
            </Reveal>
          )}
          <Reveal delay={400} className="mt-10">
            <h2 className="font-display text-3xl text-plum-900">{t.healing.upcoming}</h2>
            {batches.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {batches.map((b) => (
                  <div key={b.id} className="glass rounded-3xl p-5 text-sm">
                    <p className="flex items-center gap-2 text-base font-semibold text-plum-900"><CalendarDays className="size-4 text-gold-600" />{fmtDate(b.startsOn)}{b.endsOn ? ` – ${fmtDate(b.endsOn)}` : ""}</p>
                    {b.timing && <p className="mt-2 flex items-center gap-2 text-ink-soft"><Clock className="size-4" />{b.timing}</p>}
                    <p className="mt-1 flex items-center gap-2 text-ink-soft"><MapPin className="size-4" />{b.location} · {b.mode === "online" ? t.common.online : t.common.onsite}</p>
                    {b.seats && <p className="mt-1 flex items-center gap-2 text-ink-soft"><Users className="size-4" />{b.seats} seats</p>}
                    <p className="mt-1 flex items-center gap-2 text-ink-soft"><IndianRupee className="size-4" />{b.fee ? inr(b.fee) : s.price ? inr(s.price) : t.common.priceOnRequest}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-ink-soft">{t.healing.noBatches}</p>
            )}
          </Reveal>
        </div>
        <aside>
          <Reveal delay={200} className="glass sticky top-28 rounded-[32px] p-6 shadow-card sm:p-8">
            <h2 className="font-display text-3xl text-plum-900">{t.healing.courseEnquiry}</h2>
            <p className="mt-2 mb-6 text-sm text-ink-soft">{lang === "hi" ? "शुल्क, पाठ्यक्रम और अगली तिथियों की जानकारी के लिए।" : "For fees, syllabus and the next dates."}</p>
            <EnquiryForm
              kind="course"
              serviceId={s.id}
              batches={batches.map((b) => ({ id: b.id, label: `${fmtDate(b.startsOn)} · ${b.location ?? ""}` }))}
              labels={{ name: t.common.name, email: t.common.email, phone: t.common.phone, message: t.common.message, send: t.common.send, sending: t.common.sending, thankYou: t.common.thankYou, sent: t.healing.enquirySent }}
            />
          </Reveal>
        </aside>
      </div>
    </section>
  );
}
