"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import CrystalArt from "../common/CrystalArt";
import { cart, useCart } from "./cart";
import { useQuote } from "./useQuote";
import Summary, { type SummaryLabels } from "./Summary";
import { inr } from "@/lib/format";

type Labels = SummaryLabels & { empty: string; continue: string; checkout: string; coupon: string; apply: string; freeHint: string };

export default function CartView({ labels, lang }: { labels: Labels; lang: "en" | "hi" }) {
  const items = useCart();
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const q = useQuote(items, coupon);

  if (!items.length)
    return (
      <div className="py-20 text-center">
        <p className="font-carved text-3xl">{labels.empty}</p>
        <Link href="/products" className="btn btn-gold mt-8">{labels.continue}</Link>
      </div>
    );
  if (!q) return <Loader2 className="mx-auto mt-20 size-8 animate-spin text-amethyst-300" />;

  const remaining = q.freeAbove - (q.subtotal - q.discount);
  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
      <ul className="space-y-3">
        {q.items.map((i) => (
          <li key={i.productId} className="flex gap-4 rounded-[22px] border border-white/10 bg-night-800/70 p-3 sm:p-4">
            <Link href={`/products/${i.slug}`} className="size-24 shrink-0 overflow-hidden rounded-2xl sm:size-28">
              {i.image ? <img src={i.image} alt="" className="size-full object-cover" /> : <CrystalArt crystals={i.crystals} dark className="size-full" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/products/${i.slug}`} className="line-clamp-2 font-carved text-lg">{(lang === "hi" && i.nameHi) || i.name}</Link>
              <p className="mt-1 text-sm text-crystal/60">{inr(i.unitPrice)}{i.mrp > i.unitPrice && <span className="ml-2 line-through opacity-60">{inr(i.mrp)}</span>}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-full border border-white/15">
                  <button onClick={() => cart.set(i.productId, i.qty - 1)} className="grid size-9 place-items-center" aria-label="Decrease"><Minus className="size-4" /></button>
                  <span className="w-7 text-center text-sm font-semibold">{i.qty}</span>
                  <button disabled={i.qty >= i.stock} onClick={() => cart.set(i.productId, i.qty + 1)} className="grid size-9 place-items-center disabled:opacity-30" aria-label="Increase"><Plus className="size-4" /></button>
                </div>
                <span className="font-semibold">{inr(i.lineTotal)}</span>
                <button onClick={() => cart.remove(i.productId)} className="grid size-9 place-items-center text-crystal/50 hover:text-rose-300" aria-label="Remove"><Trash2 className="size-4" /></button>
              </div>
            </div>
          </li>
        ))}
        {q.problems.map((p) => <li key={p} className="rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-200">{p}</li>)}
      </ul>
      <aside className="h-fit space-y-5 rounded-[24px] border border-white/10 bg-night-800/70 p-5 sm:p-6 lg:sticky lg:top-28">
        {remaining > 0 && <p className="rounded-2xl bg-amethyst-500/15 p-3 text-sm text-amethyst-300">{labels.freeHint.replace("{amount}", inr(remaining))}</p>}
        <form onSubmit={(e) => { e.preventDefault(); setCoupon(couponInput.trim() || null); }} className="flex gap-2">
          <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder={labels.coupon} className="field field-dark !py-2.5" aria-label={labels.coupon} />
          <button className="btn btn-ghost-dark !px-4">{labels.apply}</button>
        </form>
        {coupon && q.couponError && <p className="text-sm text-rose-300">{q.couponError}</p>}
        <Summary q={q} labels={labels} />
        <Link href={`/checkout${coupon && !q.couponError ? `?coupon=${coupon}` : ""}`} className="btn btn-gold w-full">{labels.checkout}</Link>
        <Link href="/products" className="block text-center text-sm text-crystal/60 hover:text-crystal">{labels.continue}</Link>
      </aside>
    </div>
  );
}
