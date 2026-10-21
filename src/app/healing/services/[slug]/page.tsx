import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, Clock, IndianRupee, Monitor, Quote, UserRound } from "lucide-react";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { serviceBySlug, siteTestimonials } from "@/lib/queries";
import { inr, minutesLabel, splitList } from "@/lib/format";
import Reveal from "@/components/common/Reveal";
import Media from "@/components/common/Media";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await serviceBySlug((await params).slug);
  return s ? { title: s.nameEn, description: s.shortEn } : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await serviceBySlug(slug);
  if (!s) notFound();
  if (s.type !== "session") redirect(`/courses/${s.slug}`);
  const { lang, t } = await getDict();
  const stories = await siteTestimonials("healing", s.id);
  const mode = s.mode === "both" ? t.common.both : s.mode === "online" ? t.common.online : t.common.onsite;
  const facts = [
    { icon: Clock, label: t.healing.duration, value: minutesLabel(s.durationMinutes) || "—" },
    { icon: Monitor, label: t.healing.mode, value: mode },
    { icon: IndianRupee, label: t.healing.fee, value: s.price != null && Number(s.price) > 0 ? inr(s.price) : t.common.priceOnRequest },
    ...(s.trainer ? [{ icon: UserRound, label: t.healing.trainer, value: s.trainer.name }] : []),
  ];

  return (
    <>
      <section data-scene="page" className="relative pt-36 pb-16 sm:pt-44">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Reveal>
              <Link href="/services" className="eyebrow text-gold-600 hover:underline">← {t.nav.services}</Link>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-5 font-display text-5xl leading-[1.02] font-light text-plum-900 sm:text-7xl">{pick(s, "name", lang)}</h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-xl text-ink-soft">{pick(s, "short", lang)}</p>
            </Reveal>
            {(s.image || s.video) && (
              <Reveal delay={250} className="mt-10 overflow-hidden rounded-[32px] shadow-card">
                <Media src={s.video || s.image!} alt={s.nameEn} className="aspect-video w-full object-cover" />
              </Reveal>
            )}
            <Reveal delay={300} className="prose-soft mt-10 max-w-2xl text-lg leading-relaxed text-ink">
              {pick(s, "description", lang)
                .split(/\n{2,}/)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </Reveal>
            {splitList(s.helpsWith).length > 0 && (
              <Reveal delay={350} className="mt-10">
                <p className="eyebrow text-plum-600">{t.healing.helpsWith}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {splitList(s.helpsWith).map((h) => (
                    <span key={h} className="rounded-full border px-4 py-2 text-sm font-medium" style={{ borderColor: s.accent, color: "#432c6b", background: `${s.accent}1f` }}>
                      {h}
                    </span>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
          <aside className="lg:pt-24">
            <Reveal delay={200} className="glass sticky top-28 rounded-[32px] p-7 shadow-card">
              <dl className="space-y-5">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="grid size-11 place-items-center rounded-2xl" style={{ background: `${s.accent}26`, color: s.accent }}>
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <dt className="text-xs font-semibold tracking-wider text-mist uppercase">{label}</dt>
                      <dd className="font-semibold text-plum-900">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              {s.bookableOnline ? (
                <Link href={`/book/${s.slug}`} className="btn btn-primary mt-8 w-full">
                  {t.common.bookNow} <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link href="/contact" className="btn btn-primary mt-8 w-full">{t.common.enquire}</Link>
              )}
            </Reveal>
          </aside>
        </div>
      </section>
      {stories.length > 0 && (
        <section data-scene="testimonials" className="py-20">
          <div className="container-x grid gap-5 md:grid-cols-2">
            {stories.map((tm) => (
              <Reveal key={tm.id} className="glass rounded-[28px] p-7">
                <Quote className="size-6 text-gold-500" />
                <p className="mt-3 font-display text-2xl leading-snug text-plum-900">{pick(tm, "text", lang)}</p>
                <p className="mt-4 text-sm font-semibold text-plum-700">{tm.name}{tm.location ? ` · ${tm.location}` : ""}</p>
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
