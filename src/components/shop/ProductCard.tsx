import Link from "next/link";
import { Star } from "lucide-react";
import CrystalArt from "../common/CrystalArt";
import AddToCart from "./AddToCart";
import { inr, unitPriceOf } from "@/lib/format";
import { pick, type Dict, type Lang } from "@/i18n/dictionaries";
import type { products } from "@/db/schema";

type Product = typeof products.$inferSelect;

export default function ProductCard({ p, category, lang, t }: { p: Product; category: string | null; lang: Lang; t: Dict }) {
  const price = unitPriceOf(p);
  const off = price < Number(p.mrp) ? Math.round((1 - price / Number(p.mrp)) * 100) : 0;
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-night-800/90 to-night-900/90 transition duration-500 hover:-translate-y-1 hover:border-amethyst-400/40 hover:shadow-[0_30px_60px_-30px_rgb(169_131_230/0.6)]">
      <Link href={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden">
        {p.images[0] ? (
          <>
            <img src={p.images[0]} alt={pick(p, "name", lang)} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
            {p.images[1] && <img src={p.images[1]} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />}
          </>
        ) : (
          <CrystalArt crystals={p.crystals} category={category} dark className="size-full transition duration-700 group-hover:scale-105" />
        )}
        {off > 0 && <span className="absolute top-3 left-3 rounded-full bg-rose-300 px-2.5 py-1 text-xs font-bold text-night-900">−{off}%</span>}
        {p.stockQty > 0 && p.stockQty <= 3 && <span className="absolute top-3 right-3 rounded-full bg-night-950/80 px-2.5 py-1 text-xs font-semibold text-gold-300">{t.shop.onlyLeft.replace("{n}", String(p.stockQty))}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {category && <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-amethyst-300 uppercase">{category}</p>}
        <Link href={`/products/${p.slug}`} className="mt-1.5 line-clamp-2 font-carved text-lg leading-snug text-crystal hover:text-white">{pick(p, "name", lang)}</Link>
        {p.ratingCount > 0 && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-crystal/60">
            <Star className="size-3.5 fill-gold-400 text-gold-400" /> {Number(p.ratingAvg).toFixed(1)} ({p.ratingCount})
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-lg font-bold text-crystal">{inr(price)}</span>
          {off > 0 && <span className="text-sm text-crystal/40 line-through">{inr(p.mrp)}</span>}
        </div>
        <div className="mt-3">
          <AddToCart compact productId={p.id} stock={p.stockQty} labels={{ add: t.shop.addToCart, added: t.shop.added, out: t.shop.outOfStock }} />
        </div>
      </div>
    </div>
  );
}
