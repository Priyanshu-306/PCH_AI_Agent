import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowRight, Gem, ShieldCheck, Sparkles, Truck, Star } from "lucide-react";
import { db } from "@/db";
import { categories, products, reviews } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import { featuredProducts } from "@/lib/queries";
import { CHAKRAS, crystalTone } from "@/lib/crystal-colors";
import { HEALING_URL } from "@/lib/site";
import Reveal from "@/components/common/Reveal";
import CrystalArt from "@/components/common/CrystalArt";
import ProductCard from "@/components/shop/ProductCard";
import { ShopHero3D } from "@/components/shop/ShopCanvas";

const INTENTIONS = [
  { key: "Love", hi: "प्रेम", crystals: "Rose Quartz" },
  { key: "Abundance", hi: "समृद्धि", crystals: "Citrine" },
  { key: "Protection", hi: "सुरक्षा", crystals: "Black Tourmaline" },
  { key: "Sleep", hi: "नींद और शांति", crystals: "Amethyst" },
  { key: "Balance", hi: "चक्र संतुलन", crystals: "7 Chakra" },
  { key: "Wealth", hi: "धन", crystals: "Pyrite" },
];

export default async function ShopHome() {
  const { lang, t } = await getDict();
  const [c, featured, cats, latestReviews] = await Promise.all([
    getContent("shop", lang),
    featuredProducts(8),
    db.select().from(categories).orderBy(asc(categories.sort)),
    db
      .select({ r: reviews, product: products.nameEn, slug: products.slug })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      .where(and(eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt))
      .limit(6),
  ]);
  const usedCats = (await db.selectDistinct({ id: products.categoryId }).from(products).where(eq(products.status, "active"))).map((r) => r.id);
  const shownCats = cats.filter((x) => usedCats.includes(x.id)).slice(0, 8);
  const heroColors = featured.length ? featured.map(({ p }) => crystalTone(p.crystals).base) : ["#9b6ad6", "#f2b8c8", "#f2b84b", "#5fae7a", "#46a8e0", "#2f4fa8"];

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_40%,#3a2468_0%,#160d27_55%,#0e0819_100%)]" />
        <div aria-hidden className="absolute inset-0 -z-10 opacity-60 [background:radial-gradient(circle_at_20%_80%,rgba(242,198,212,.18),transparent_40%)]" />
        <div className="absolute inset-0 top-[38%] -z-10 sm:top-0 sm:left-[42%]">
          <ShopHero3D colors={heroColors} />
        </div>
        <div className="container-x flex min-h-[100svh] items-start pt-32 sm:items-center sm:pt-0">
          <div className="max-w-xl">
            <Reveal><p className="eyebrow text-gold-300">{c("hero.eyebrow")}</p></Reveal>
            <Reveal delay={120}>
              <h1 className="shimmer-text mt-5 font-carved text-[2.9rem] leading-[1.02] sm:text-7xl">{c("hero.title")}</h1>
            </Reveal>
            <Reveal delay={240}><p className="mt-6 max-w-md text-lg text-crystal/75">{c("hero.subtitle")}</p></Reveal>
            <Reveal delay={360} className="mt-9 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-gold">{t.nav.shop} <ArrowRight className="size-4" /></Link>
              <a href="#intentions" className="btn btn-ghost-dark">{c("intentions.title")}</a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Promises */}
      <section className="border-y border-white/10 bg-night-950/60">
        <div className="container-x grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {[Gem, Sparkles, Truck, ShieldCheck].map((Icon, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-crystal/80">
              <Icon className="size-5 shrink-0 text-amethyst-300" aria-hidden />
              {c(`promise.${i + 1}`)}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- Collections */}
      <section className="py-24">
        <div className="container-x">
          <Reveal><h2 className="font-carved text-4xl sm:text-5xl">{c("collections.title")}</h2></Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {shownCats.map((cat, i) => {
              const sample = featured.find(({ p }) => p.categoryId === cat.id)?.p;
              return (
                <Reveal key={cat.id} delay={(i % 4) * 80}>
                  <Link href={`/products?category=${cat.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[24px] border border-white/10">
                    <CrystalArt crystals={sample?.crystals ?? ["Amethyst", "Rose Quartz", "Citrine", "Clear Quartz"][i % 4]} category={cat.nameEn} dark className="absolute inset-0 size-full transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-night-950/90 via-transparent" />
                    <span className="absolute bottom-4 left-4 font-carved text-xl text-crystal sm:text-2xl">{pick(cat, "name", lang)}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Featured */}
      <section className="py-10">
        <div className="container-x">
          <div className="flex items-end justify-between gap-4">
            <Reveal><h2 className="font-carved text-4xl sm:text-5xl">{c("featured.title")}</h2></Reveal>
            <Link href="/products" className="hidden text-sm font-semibold text-gold-300 hover:underline sm:block">{t.common.viewAll} →</Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map(({ p, category }, i) => (
              <Reveal key={p.id} delay={(i % 4) * 80} className="h-full">
                <ProductCard p={p} category={category} lang={lang} t={t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Intentions & chakras */}
      <section id="intentions" className="scroll-mt-24 py-24">
        <div className="container-x">
          <Reveal><h2 className="font-carved text-4xl sm:text-5xl">{c("intentions.title")}</h2></Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {INTENTIONS.map((it, i) => {
              const tone = crystalTone(it.crystals);
              return (
                <Reveal key={it.key} delay={i * 60}>
                  <Link href={`/products?intention=${it.key}`} className="group block rounded-[22px] border border-white/10 p-5 transition hover:border-white/30" style={{ background: `radial-gradient(circle at 30% 20%, ${tone.base}55, transparent 65%), #1f1436` }}>
                    <span className="block size-10 rounded-full shadow-[0_0_30px_-4px_currentColor]" style={{ background: `radial-gradient(circle at 35% 30%, ${tone.light}, ${tone.base} 60%, ${tone.deep})`, color: tone.base }} />
                    <span className="mt-6 block font-carved text-xl">{lang === "hi" ? it.hi : it.key}</span>
                    <span className="mt-1 block text-xs text-crystal/55">{it.crystals}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-14">
            <p className="eyebrow text-amethyst-300">{t.shop.chakra}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {CHAKRAS.map((ch) => (
                <Link key={ch.key} href={`/products?chakra=${encodeURIComponent(ch.key)}`} className="flex items-center gap-2.5 rounded-full border border-white/10 bg-night-800 px-4 py-2.5 text-sm transition hover:border-white/30">
                  <span className="size-3 rounded-full" style={{ background: ch.color, boxShadow: `0 0 14px 2px ${ch.color}` }} />
                  {lang === "hi" ? ch.hi : ch.key}
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Ritual + About */}
      <section className="py-16">
        <div className="container-x grid gap-5 lg:grid-cols-2">
          <Reveal className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_80%_20%,rgba(169,131,230,.35),transparent_55%),#1f1436] p-8 sm:p-12">
            <h2 className="font-carved text-3xl sm:text-4xl">{c("ritual.title")}</h2>
            <p className="mt-5 text-lg leading-relaxed text-crystal/75">{c("ritual.body")}</p>
          </Reveal>
          <Reveal delay={120} className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_20%_80%,rgba(242,198,212,.3),transparent_55%),#1f1436] p-8 sm:p-12">
            <h2 className="font-carved text-3xl sm:text-4xl">{c("about.title")}</h2>
            <p className="mt-5 text-lg leading-relaxed text-crystal/75">{c("about.body")}</p>
            <a href={HEALING_URL} className="btn btn-ghost-dark mt-8">Pure Conscious Healing <ArrowRight className="size-4" /></a>
          </Reveal>
        </div>
      </section>

      {latestReviews.length > 0 && (
        <section className="py-16">
          <div className="container-x">
            <Reveal><h2 className="font-carved text-4xl">{t.shop.reviews}</h2></Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {latestReviews.map(({ r, product, slug }) => (
                <Reveal key={r.id} className="rounded-[24px] border border-white/10 bg-night-800 p-6">
                  <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-gold-400 text-gold-400" : "text-white/20"}`} />)}</div>
                  <p className="mt-3 text-crystal/85">{r.body}</p>
                  <p className="mt-4 text-sm text-crystal/55">{r.name} · <Link href={`/products/${slug}`} className="underline">{product}</Link></p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
