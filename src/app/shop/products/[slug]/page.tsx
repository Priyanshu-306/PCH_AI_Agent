import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, desc, eq, ne } from "drizzle-orm";
import { Gem, Ruler, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { db } from "@/db";
import { categories, products, reviews, wishlist } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { fill, pick } from "@/i18n/dictionaries";
import { getCustomer } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { CHAKRAS, crystalTone } from "@/lib/crystal-colors";
import { inr, splitList, unitPriceOf } from "@/lib/format";
import AddToCart from "@/components/shop/AddToCart";
import Gallery from "@/components/shop/Gallery";
import ProductCard from "@/components/shop/ProductCard";
import ReviewForm from "@/components/shop/ReviewForm";
import WishlistButton from "@/components/shop/WishlistButton";

async function load(slug: string) {
  const [row] = await db
    .select({ p: products, category: categories.nameEn, categoryHi: categories.nameHi, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), ne(products.status, "draft")));
  return row;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const row = await load((await params).slug);
  if (!row) return {};
  return { title: row.p.nameEn, description: row.p.descriptionEn.slice(0, 160), openGraph: { images: row.p.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const row = await load((await params).slug);
  if (!row) notFound();
  const { p } = row;
  const { lang, t } = await getDict();
  const [customer, shipping, approved, related] = await Promise.all([
    getCustomer(),
    getSetting("shipping"),
    db.select().from(reviews).where(and(eq(reviews.productId, p.id), eq(reviews.status, "approved"))).orderBy(desc(reviews.createdAt)),
    db
      .select({ p: products, category: categories.nameEn })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(eq(products.status, "active"), ne(products.id, p.id), p.categoryId ? eq(products.categoryId, p.categoryId) : undefined))
      .limit(4),
  ]);
  const saved = customer ? (await db.select().from(wishlist).where(and(eq(wishlist.customerId, customer.id), eq(wishlist.productId, p.id)))).length > 0 : false;
  const price = unitPriceOf(p);
  const off = price < Number(p.mrp) ? Math.round((1 - price / Number(p.mrp)) * 100) : 0;
  const tone = crystalTone(p.crystals);
  const crystalList = splitList(p.crystals);
  const colors = crystalList.some((c) => c.toLowerCase().includes("chakra")) ? CHAKRAS.map((c) => c.color) : crystalList.map((c) => crystalTone(c).base);
  const chakraList = splitList(p.chakras);
  const category = (lang === "hi" && row.categoryHi) || row.category || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nameEn,
    sku: p.sku,
    image: p.images,
    description: p.descriptionEn,
    offers: { "@type": "Offer", priceCurrency: "INR", price, availability: p.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    ...(p.ratingCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(p.ratingAvg), reviewCount: p.ratingCount } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="pt-32 pb-10 sm:pt-36">
        <div className="container-x">
          <nav className="text-sm text-crystal/55" aria-label="Breadcrumb">
            <Link href="/products" className="hover:text-crystal">{t.nav.shop}</Link>
            {row.categorySlug && <> / <Link href={`/products?category=${row.categorySlug}`} className="hover:text-crystal">{category}</Link></>}
          </nav>
          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <Gallery images={p.images} video={p.video} name={p.nameEn} crystals={p.crystals} category={row.category ?? ""} color={tone.base} colors={colors.length ? colors : [tone.base]} note={t.shop.illustrative} />
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-amethyst-300 uppercase">{category}</p>
              <h1 className="mt-2 font-carved text-4xl leading-tight sm:text-5xl">{pick(p, "name", lang)}</h1>
              {p.ratingCount > 0 && (
                <a href="#reviews" className="mt-3 flex items-center gap-1.5 text-sm text-crystal/70">
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < Math.round(Number(p.ratingAvg)) ? "fill-gold-400 text-gold-400" : "text-white/20"}`} />)}
                  {Number(p.ratingAvg).toFixed(1)} · {p.ratingCount} {t.shop.reviews.toLowerCase()}
                </a>
              )}
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-3xl font-bold">{inr(price)}</span>
                {off > 0 && <><span className="text-lg text-crystal/40 line-through">{inr(p.mrp)}</span><span className="rounded-full bg-rose-300 px-2.5 py-1 text-xs font-bold text-night-900">−{off}%</span></>}
              </div>
              <p className="mt-1 text-xs text-crystal/50">{t.shop.inclGst}</p>
              <p className={`mt-4 text-sm font-semibold ${p.stockQty > 3 ? "text-emerald-300" : p.stockQty > 0 ? "text-gold-300" : "text-rose-300"}`}>
                {p.stockQty > 3 ? t.shop.inStock : p.stockQty > 0 ? fill(t.shop.onlyLeft, { n: p.stockQty }) : t.shop.outOfStock}
              </p>
              <div className="mt-6 flex gap-3">
                <div className="flex-1"><AddToCart productId={p.id} stock={p.stockQty} labels={{ add: t.shop.addToCart, added: t.shop.added, out: t.shop.outOfStock }} /></div>
                <WishlistButton productId={p.id} saved={saved} loggedIn={!!customer} />
              </div>
              <ul className="mt-6 grid gap-2 text-sm text-crystal/70 sm:grid-cols-2">
                <li className="flex items-center gap-2"><Truck className="size-4 text-amethyst-300" />{shipping.freeAbove ? `Free shipping above ${inr(shipping.freeAbove)}` : "Free shipping"}</li>
                {shipping.codEnabled && <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-amethyst-300" />Cash on delivery available</li>}
                <li className="flex items-center gap-2"><Sparkles className="size-4 text-amethyst-300" />Cleansed & energised before dispatch</li>
                {p.size && <li className="flex items-center gap-2"><Ruler className="size-4 text-amethyst-300" />{p.size}</li>}
              </ul>

              <div className="mt-8 space-y-6 border-t border-white/10 pt-8">
                {splitList(p.healingProperties).length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-crystal/55 uppercase">{t.shop.properties}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {splitList(p.healingProperties).map((h) => <span key={h} className="rounded-full border border-amethyst-300/25 bg-amethyst-500/10 px-3.5 py-1.5 text-sm">{h}</span>)}
                    </div>
                  </div>
                )}
                {chakraList.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-crystal/55 uppercase">{t.shop.chakra}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chakraList.map((name) => {
                        const ch = CHAKRAS.find((c) => c.key.toLowerCase() === name.toLowerCase());
                        return <Link key={name} href={`/products?chakra=${encodeURIComponent(name)}`} className="flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 text-sm"><span className="size-2.5 rounded-full" style={{ background: ch?.color ?? "#fff" }} />{lang === "hi" && ch ? ch.hi : name}</Link>;
                      })}
                    </div>
                  </div>
                )}
                {p.zodiac && (
                  <div>
                    <h2 className="text-xs font-semibold tracking-[0.2em] text-crystal/55 uppercase">{t.shop.zodiac}</h2>
                    <p className="mt-2 text-crystal/80">{p.zodiac}</p>
                  </div>
                )}
                <div>
                  <h2 className="text-xs font-semibold tracking-[0.2em] text-crystal/55 uppercase">{t.shop.details}</h2>
                  <div className="prose-soft mt-3 leading-relaxed text-crystal/80">
                    {pick(p, "description", lang).split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-crystal/45"><Gem className="size-3.5" />SKU {p.sku}</p>
                </div>
              </div>
            </div>
          </div>

          <div id="reviews" className="mt-20 grid scroll-mt-28 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="font-carved text-3xl">{t.shop.reviews}</h2>
              {approved.length ? (
                <ul className="mt-6 space-y-4">
                  {approved.map((r) => (
                    <li key={r.id} className="rounded-[20px] border border-white/10 bg-night-800/60 p-5">
                      <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-gold-400 text-gold-400" : "text-white/20"}`} />)}</div>
                      {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                      <p className="mt-1 text-crystal/80">{r.body}</p>
                      <p className="mt-3 text-xs text-crystal/50">{r.name}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-crystal/60">{t.shop.noReviews}</p>
              )}
            </div>
            <ReviewForm productId={p.id} defaultName={customer?.name} labels={{ write: t.shop.writeReview, thanks: t.shop.reviewThanks, name: t.common.name, submit: t.common.submit }} />
          </div>

          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="font-carved text-3xl">{lang === "hi" ? "आपको यह भी पसंद आ सकता है" : "You may also love"}</h2>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {related.map((r) => <ProductCard key={r.p.id} p={r.p} category={r.category} lang={lang} t={t} />)}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
