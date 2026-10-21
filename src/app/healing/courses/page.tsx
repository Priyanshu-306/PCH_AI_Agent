import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import { learningServices, upcomingBatches } from "@/lib/queries";
import { fmtDate } from "@/lib/format";
import PageHero from "@/components/healing/PageHero";
import Reveal from "@/components/common/Reveal";

export const metadata: Metadata = { title: "Courses & Workshops" };

export default async function CoursesPage() {
  const { lang, t } = await getDict();
  const [c, learning] = await Promise.all([getContent("healing", lang), learningServices()]);
  const batches = await upcomingBatches(learning.map((l) => l.id));
  return (
    <>
      <PageHero eyebrow={t.nav.courses} title={c("courses.title")} body={c("courses.subtitle")} />
      <section data-scene="learn" className="pb-10">
        <div className="container-x space-y-5">
          {learning.map((l, i) => {
            const mine = batches.filter((b) => b.serviceId === l.id);
            return (
              <Reveal key={l.id} delay={i * 60}>
                <Link href={`/courses/${l.slug}`} className="group glass grid gap-6 rounded-[28px] p-6 transition hover:shadow-glow sm:p-8 md:grid-cols-[1fr_auto]">
                  <div>
                    <span className="eyebrow" style={{ color: l.accent }}>{l.type}</span>
                    <h2 className="mt-2 font-display text-3xl text-plum-900 sm:text-4xl">{pick(l, "name", lang)}</h2>
                    <p className="mt-3 max-w-2xl text-ink-soft">{pick(l, "short", lang)}</p>
                  </div>
                  <div className="flex flex-col justify-between gap-4 md:min-w-64 md:items-end">
                    {mine.length ? (
                      <ul className="space-y-1 text-sm md:text-right">
                        {mine.slice(0, 2).map((b) => (
                          <li key={b.id} className="flex items-center gap-2 font-semibold text-plum-800 md:justify-end"><CalendarDays className="size-4 text-gold-600" />{fmtDate(b.startsOn)} · <MapPin className="size-4 text-gold-600" />{b.location}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-mist">{t.healing.noBatches}</p>
                    )}
                    <span className="inline-flex items-center gap-2 font-semibold text-plum-700">{t.common.learnMore} <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
