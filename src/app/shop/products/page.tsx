import type { Metadata } from "next";
import { Suspense } from "react";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { fill, pick } from "@/i18n/dictionaries";
import { CHAKRAS, ZODIAC } from "@/lib/crystal-colors";
import ProductCard from "@/components/shop/ProductCard";
import Filters from "@/components/shop/Filters";

export const metadata: Metadata = { title: "All Crystals" };

const INTENTIONS = ["Love", "Abundance", "Protection", "Sleep", "Calm", "Balance", "Wealth", "Confidence", "Intuition", "Meditation", "Grounding", "Luck"];
const PAGE = 24;
type SP = Record<string, string | undefined>;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { lang, t } = await getDict();
  const cats = await db.select().from(categories).orderBy(asc(categories.sort));

  const price = sql`coalesce(nullif(${products.salePrice}, 0), ${products.mrp})`;
  const where: SQL[] = [eq(products.status, "active")];
  if (sp.q) {
    const q = `%${sp.q}%`;
    where.push(or(ilike(products.nameEn, q), ilike(products.nameHi, q), ilike(products.crystals, q), ilike(products.healingProperties, q), ilike(products.sku, q))!);
  }
  const cat = cats.find((c) => c.slug === sp.category);
  if (cat) where.push(eq(products.categoryId, cat.id));
  if (sp.chakra) where.push(ilike(products.chakras, `%${sp.chakra}%`));
  if (sp.zodiac) where.push(ilike(products.zodiac, `%${sp.zodiac}%`));
  if (sp.intention) where.push(ilike(products.healingProperties, `%${sp.intention}%`));
  if (sp.price) {
    const [min, max] = sp.price.split("-").map((v) => (v ? Number(v) : null));
    if (min != null) where.push(gte(price, min));
    if (max != null) where.push(lte(price, max));
  }
  const order =
    sp.sort === "new" ? [desc(products.createdAt)] : sp.sort === "low" ? [asc(price)] : sp.sort === "high" ? [desc(price)] : sp.sort === "rating" ? [desc(products.ratingAvg)] : [desc(products.isFeatured), desc(sql`${products.stockQty} > 0`), asc(products.id)];
  const page = Math.max(1, Number(sp.page ?? 1));

  const [rows, [{ n }]] = await Promise.all([
    db
      .select({ p: products, category: categories.nameEn, categoryHi: categories.nameHi })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...where))
      .orderBy(...order)
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    db.select({ n: sql<number>`count(*)::int` }).from(products).where(and(...where)),
  ]);
  const pages = Math.ceil(n / PAGE);
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    u.set("page", String(p));
    return `/products?${u}`;
  };

  return (
    <section className="pt-36 pb-10">
      <div className="container-x">
        <h1 className="font-carved text-5xl sm:text-6xl">{cat ? pick(cat, "name", lang) : t.nav.shop}</h1>
        <p className="mt-3 text-crystal/60">{fill(t.shop.results, { n })}</p>
        <div className="mt-8">
          <Suspense>
            <Filters
              categories={cats.map((c) => ({ value: c.slug, label: pick(c, "name", lang) }))}
              chakras={CHAKRAS.map((c) => ({ value: c.key, label: lang === "hi" ? c.hi : c.key }))}
              zodiac={ZODIAC.map((z) => ({ value: z, label: z }))}
              intentions={INTENTIONS.map((i) => ({ value: i, label: i }))}
              labels={{
                filters: t.shop.filters, category: t.shop.category, chakra: t.shop.chakra, zodiac: t.shop.zodiac, intention: t.shop.intention, sort: t.shop.sort, clear: t.shop.clear, price: t.shop.price,
                search: lang === "hi" ? "क्रिस्टल, उद्देश्य या नाम खोजें…" : "Search crystals, intentions or names…",
                sorts: [
                  { value: "", label: t.shop.sortFeatured },
                  { value: "new", label: t.shop.sortNew },
                  { value: "low", label: t.shop.sortLow },
                  { value: "high", label: t.shop.sortHigh },
                  { value: "rating", label: t.shop.sortRating },
                ],
              }}
            />
          </Suspense>
        </div>
        {rows.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {rows.map(({ p, category, categoryHi }) => (
              <ProductCard key={p.id} p={p} category={(lang === "hi" && categoryHi) || category} lang={lang} t={t} />
            ))}
          </div>
        ) : (
          <p className="mt-16 text-center text-crystal/60">{lang === "hi" ? "कोई क्रिस्टल नहीं मिला। फ़िल्टर बदलकर देखें।" : "No crystals match these filters yet."}</p>
        )}
        {pages > 1 && (
          <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: pages }, (_, i) => (
              <a key={i} href={qs(i + 1)} aria-current={page === i + 1 ? "page" : undefined} className={`grid size-11 place-items-center rounded-full text-sm font-semibold ${page === i + 1 ? "bg-gold-400 text-night-900" : "border border-white/15"}`}>
                {i + 1}
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
