import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, wishlist } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { getCustomer } from "@/lib/auth";
import ProductCard from "@/components/shop/ProductCard";

export const metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account?next=/wishlist");
  const { lang, t } = await getDict();
  const rows = await db
    .select({ p: products, category: categories.nameEn })
    .from(wishlist)
    .innerJoin(products, eq(products.id, wishlist.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(wishlist.customerId, customer.id))
    .orderBy(desc(wishlist.createdAt));
  return (
    <section className="pt-36 pb-10">
      <div className="container-x">
        <h1 className="font-carved text-5xl">{t.nav.wishlist}</h1>
        {rows.length ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {rows.map(({ p, category }) => <ProductCard key={p.id} p={p} category={category} lang={lang} t={t} />)}
          </div>
        ) : (
          <p className="mt-8 text-crystal/60">Nothing saved yet. <Link href="/products" className="text-gold-300 underline">Explore crystals</Link></p>
        )}
      </div>
    </section>
  );
}
