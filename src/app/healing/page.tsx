import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, MapPin, Quote, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import { featuredProducts, learningServices, sessionServices, siteTestimonials, upcomingBatches, activeTrainers } from "@/lib/queries";
import { CHAKRAS } from "@/lib/crystal-colors";
import { fmtDate, inr, unitPriceOf } from "@/lib/format";
import { SHOP_URL } from "@/lib/site";
import Reveal from "@/components/common/Reveal";
import Media from "@/components/common/Media";
import CrystalArt from "@/components/common/CrystalArt";
import ServiceCard from "@/components/healing/ServiceCard";
import SectionHeading from "@/components/healing/SectionHeading";
import ScrollVideo from "@/components/healing/ScrollVideo";

export default async function HealingHome() {
  const { lang, t } = await getDict();
  const [c, sessions, learning, testimonials, featured, trainers] = await Promise.all([
    getContent("healing", lang),
    sessionServices(),
    learningServices(),
    siteTestimonials("healing"),
    featuredProducts(4),
    activeTrainers(),
  ]);
  const batches = await upcomingBatches(learning.map((l) => l.id));
  const heroVideo = c("hero.video");
  const founder = trainers.find((tr) => tr.isFounder);

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section data-scene="hero" className="relative flex min-h-[100svh] items-end overflow-hidden pb-16 sm:items-center sm:pb-0">
        {heroVideo && (
          <div className="absolute inset-0 -z-[1] opacity-40 mix-blend-multiply">
            <Media src={heroVideo} className="size-full object-cover" />
          </div>
        )}
        <div className="container-x pt-28">
          <div className="max-w-2xl">
            <Reveal>
              <p className="eyebrow text-gold-600">{c("hero.eyebrow")}</p>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="mt-5 font-display text-[3.2rem] leading-[0.98] font-light text-balance text-plum-900 sm:text-7xl lg:text-[5.6rem]">
                {c("hero.title")}
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-6 max-w-xl text-lg text-ink-soft sm:text-xl">{c("hero.subtitle")}</p>
            </Reveal>
            <Reveal delay={360} className="mt-9 flex flex-wrap gap-3">
              <Link href="/book" className="btn btn-primary">
                {t.nav.book} <ArrowRight className="size-4" />
              </Link>
              <Link href="/services" className="btn btn-ghost">
                {t.nav.services}
              </Link>
            </Reveal>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-mist sm:flex">
          <span className="eyebrow !text-[0.6rem]">{t.common.scroll}</span>
          <ArrowDown className="size-4 animate-bounce" />
        </div>
      </section>

      {/* ---------------------------------------------------------------- Intro */}
      <section data-scene="intro" className="relative py-28 sm:py-40">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="hidden lg:block" />
          <div>
            <SectionHeading eyebrow="Pure Conscious Healing" title={c("intro.title")} body={c("intro.body")} />
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Users, text: c("intro.stat1") },
                { icon: Sparkles, text: c("intro.stat2") },
                { icon: ShieldCheck, text: c("intro.stat3") },
              ].map(({ icon: Icon, text }, i) => (
                <Reveal key={i} delay={i * 100} className="glass rounded-2xl p-4">
                  <Icon className="size-5 text-gold-600" aria-hidden />
                  <p className="mt-2 text-sm font-semibold text-plum-800">{text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Services */}
      <section data-scene="services" id="services" className="relative py-24">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading eyebrow={t.nav.services} title={c("services.title")} body={c("services.subtitle")} />
            <Reveal>
              <Link href="/services" className="btn btn-ghost">
                {t.common.viewAll} <ArrowRight className="size-4" />
              </Link>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 110} className="h-full">
                <ServiceCard s={s} lang={lang} t={t} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Chakra journey (3D column follows scroll) */}
      <section data-scene="chakra" className="relative mt-24 text-white">
        <div className="container-x">
          <div className="grid lg:grid-cols-2">
            <div>
              <div className="flex min-h-[80svh] flex-col justify-center py-24">
                <SectionHeading eyebrow="Chakra balancing" title={c("chakra.title")} body={c("chakra.body")} light />
              </div>
              {CHAKRAS.map((ch, i) => (
                <div key={ch.key} data-chakra-step={i} className="flex min-h-[70svh] items-center py-10">
                  <Reveal className="glass-dark max-w-md rounded-[28px] p-7 sm:p-9">
                    <div className="flex items-center gap-3">
                      <span className="size-3 rounded-full" style={{ background: ch.color, boxShadow: `0 0 24px 6px ${ch.color}` }} />
                      <span className="eyebrow text-white/60">{String(i + 1).padStart(2, "0")} / 07</span>
                    </div>
                    <h3 className="mt-4 font-display text-4xl font-light sm:text-5xl">{lang === "hi" ? ch.hi : ch.key}</h3>
                    <p className="mt-1 font-display text-xl text-white/60 italic">{ch.sanskrit}</p>
                    <p className="mt-4 text-white/80">{lang === "hi" ? ch.themeHi : ch.theme}</p>
                  </Reveal>
                </div>
              ))}
              <div className="h-[30svh]" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Healing space (scroll-scrubbed video) */}
      <section data-scene="space" className="relative">
        <ScrollVideo
          video={c("space.video")}
          images={[c("space.image1"), c("space.image2"), c("space.image3")].filter(Boolean)}
          title={c("space.title")}
          body={c("space.body")}
        />
      </section>

      {/* ---------------------------------------------------------------- Founder */}
      <section data-scene="founder" className="relative py-28 sm:py-40">
        <div className="container-x grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-6 rounded-[48px] bg-gradient-to-br from-gold-300/50 via-lavender-300/50 to-rose-300/40 blur-2xl" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] border border-white/70 bg-gradient-to-br from-lavender-200 to-sand-200 shadow-card">
              {c("founder.image") ? (
                <img src={c("founder.image")} alt={founder?.name ?? "Founder"} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center">
                  <span className="font-display text-[9rem] leading-none font-light text-plum-700/30">PC</span>
                </div>
              )}
            </div>
          </Reveal>
          <div>
            <SectionHeading eyebrow={t.healing.meetFounder} title={c("founder.title")} />
            <Reveal delay={100}>
              <p className="mt-2 text-sm font-semibold tracking-wide text-gold-600">{c("founder.role")}</p>
              <p className="mt-6 text-lg leading-relaxed text-ink-soft">{c("founder.story")}</p>
              <blockquote className="mt-8 border-l-2 border-gold-500 pl-5 font-display text-2xl leading-snug text-plum-800 italic sm:text-3xl">{c("founder.quote")}</blockquote>
              <Link href="/about" className="btn btn-ghost mt-8">
                {t.common.learnMore} <ArrowRight className="size-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Learn: courses + trainers */}
      <section data-scene="learn" className="relative py-24">
        <div className="container-x">
          <SectionHeading eyebrow={t.nav.courses} title={c("courses.title")} body={c("courses.subtitle")} />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {learning.map((l, i) => {
              const next = batches.find((b) => b.serviceId === l.id);
              return (
                <Reveal key={l.id} delay={i * 100} className="h-full">
                  <Link href={`/courses/${l.slug}`} className="group glass flex h-full flex-col rounded-[28px] p-7 shadow-card transition hover:shadow-glow">
                    <span className="eyebrow" style={{ color: l.accent }}>{l.type}</span>
                    <h3 className="mt-3 font-display text-3xl leading-tight text-plum-900">{pick(l, "name", lang)}</h3>
                    <p className="mt-3 flex-1 text-ink-soft">{pick(l, "short", lang)}</p>
                    {next ? (
                      <div className="mt-6 space-y-1.5 rounded-2xl bg-white/60 p-4 text-sm">
                        <p className="flex items-center gap-2 font-semibold text-plum-800"><CalendarDays className="size-4 text-gold-600" />{fmtDate(next.startsOn)}{next.endsOn ? ` – ${fmtDate(next.endsOn)}` : ""}</p>
                        <p className="flex items-center gap-2 text-ink-soft"><MapPin className="size-4 text-gold-600" />{next.location} · {next.timing}</p>
                      </div>
                    ) : (
                      <p className="mt-6 text-sm text-mist">{t.healing.noBatches}</p>
                    )}
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-plum-700">
                      {t.common.enquire} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-24">
            <SectionHeading eyebrow={t.nav.trainers} title={c("trainers.title")} body={c("trainers.subtitle")} />
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {trainers.map((tr, i) => (
                <Reveal key={tr.id} delay={i * 100}>
                  <div className="glass flex gap-5 rounded-[28px] p-5 sm:p-6">
                    <div className="size-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-lavender-300 to-gold-300 sm:size-28">
                      {tr.photo ? (
                        <img src={tr.photo} alt={tr.name} className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center font-display text-4xl text-white">{tr.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-plum-900">{tr.name}</h3>
                      <p className="text-sm font-semibold text-gold-600">{pick(tr, "title", lang)}</p>
                      <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{pick(tr, "bio", lang)}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Testimonials */}
      {testimonials.length > 0 && (
        <section data-scene="testimonials" className="relative overflow-hidden py-28">
          <div className="container-x">
            <SectionHeading eyebrow="Testimonials" title={c("testimonials.title")} center />
          </div>
          <div className="mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 [scrollbar-width:none] sm:px-[max(28px,calc((100vw-1160px)/2))]">
            {testimonials.map((tm) => (
              <figure key={tm.id} className="glass w-[85vw] max-w-md shrink-0 snap-center rounded-[28px] p-7 shadow-card sm:p-9">
                <Quote className="size-8 text-gold-500" aria-hidden />
                <blockquote className="mt-4 font-display text-2xl leading-snug text-plum-900">{pick(tm, "text", lang)}</blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-semibold text-plum-800">{tm.name}</span>
                  {tm.location && <span className="text-mist"> · {tm.location}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------------- Crystal showcase → Pure Crystal Hub */}
      <section data-scene="crystals" className="relative py-28 text-white sm:py-40">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div className="h-[34svh] lg:hidden" aria-hidden />
          <div className="-mt-12 lg:mt-0 lg:pt-10">
            <SectionHeading eyebrow="Pure Crystal Hub" title={c("crystals.title")} body={c("crystals.body")} light />
            <Reveal delay={150}>
              <a href={SHOP_URL} className="btn btn-gold mt-9">
                {t.healing.visitShop} <ArrowRight className="size-4" />
              </a>
            </Reveal>
          </div>
          <div className="hidden lg:block" />
        </div>
        <div className="container-x mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map(({ p, category }, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <a href={`${SHOP_URL}/products/${p.slug}`} className="group glass-dark block overflow-hidden rounded-[24px]">
                <div className="aspect-square overflow-hidden">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.nameEn} className="size-full object-cover transition duration-700 group-hover:scale-105" />
                  ) : (
                    <CrystalArt crystals={p.crystals} category={category} dark className="size-full transition duration-700 group-hover:scale-105" />
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 font-carved text-base">{pick(p, "name", lang)}</p>
                  <p className="mt-1 text-sm text-amethyst-300">{inr(unitPriceOf(p))}</p>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Closing CTA */}
      <section data-scene="cta" className="relative flex min-h-[90svh] items-center py-24">
        <div className="container-x text-center">
          <SectionHeading title={c("cta.title")} body={c("cta.body")} center />
          <Reveal delay={150} className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/book" className="btn btn-primary">
              {t.nav.book} <ArrowRight className="size-4" />
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              {t.nav.contact}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
