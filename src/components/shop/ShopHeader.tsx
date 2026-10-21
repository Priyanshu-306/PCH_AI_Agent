"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gem, Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import LangToggle from "../common/LangToggle";
import { cartCount, useCart } from "./cart";

type Props = {
  lang: "en" | "hi";
  logo: string;
  announcement: string;
  categories: { slug: string; name: string }[];
  labels: { shop: string; collections: string; account: string; cart: string; wishlist: string; backToHealing: string; language: string };
  healingUrl: string;
};

export default function ShopHeader({ lang, logo, announcement, categories, labels, healingUrl }: Props) {
  const items = useCart();
  const count = cartCount(items);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 24);
    const id = requestAnimationFrame(on);
    addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      removeEventListener("scroll", on);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {announcement && (
        <div className={`overflow-hidden bg-gradient-to-r from-amethyst-600 via-night-700 to-amethyst-600 text-center text-xs font-medium tracking-wide text-crystal transition-all duration-500 ${scrolled ? "max-h-0 py-0" : "max-h-12 py-2"}`}>
          <div className="container-x">{announcement}</div>
        </div>
      )}
      <div className={`transition-all duration-500 ${scrolled || open ? "glass-dark !bg-night-900/95 py-2" : "py-4"}`}>
        <div className="container-x flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button className="grid size-11 place-items-center rounded-full text-crystal lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              {open ? <X /> : <Menu />}
            </button>
            <Link href="/" className="flex items-center gap-2.5" aria-label="Pure Crystal Hub — home">
              {logo ? (
                <img src={logo} alt="Pure Crystal Hub" className="h-10 w-auto" />
              ) : (
                <>
                  <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-amethyst-400 to-rose-300 text-night-900 shadow-[0_0_30px_-6px_#a983e6]">
                    <Gem className="size-4" />
                  </span>
                  <span className="font-carved text-xl tracking-wider whitespace-nowrap text-crystal">Pure Crystal Hub</span>
                </>
              )}
            </Link>
          </div>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            <Link href="/products" className="rounded-full px-3 py-2 text-sm whitespace-nowrap text-crystal/80 hover:text-crystal">{labels.shop}</Link>
            {categories.slice(0, 4).map((c, i) => (
              <Link key={c.slug} href={`/products?category=${c.slug}`} className={`rounded-full px-3 py-2 text-sm whitespace-nowrap text-crystal/80 hover:text-crystal ${i > 1 ? "hidden xl:inline" : ""}`}>{c.name}</Link>
            ))}
            <a href={healingUrl} className="rounded-full px-3 py-2 text-sm whitespace-nowrap text-gold-300 hover:text-gold-400">{labels.backToHealing}</a>
          </nav>
          <div className="flex items-center gap-0.5">
            <LangToggle lang={lang} label={labels.language} className="hidden text-crystal hover:bg-white/10 sm:inline-flex" />
            <Link href="/products?focus=search" className="grid size-11 place-items-center rounded-full text-crystal hover:bg-white/10" aria-label="Search"><Search className="size-5" /></Link>
            <Link href="/wishlist" className="hidden size-11 place-items-center rounded-full text-crystal hover:bg-white/10 sm:grid" aria-label={labels.wishlist}><Heart className="size-5" /></Link>
            <Link href="/account" className="grid size-11 place-items-center rounded-full text-crystal hover:bg-white/10" aria-label={labels.account}><UserRound className="size-5" /></Link>
            <Link href="/cart" className="relative grid size-11 place-items-center rounded-full text-crystal hover:bg-white/10" aria-label={`${labels.cart} (${count})`}>
              <ShoppingBag className="size-5" />
              {count > 0 && <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-gold-400 px-1 text-[0.65rem] font-bold text-night-900">{count}</span>}
            </Link>
          </div>
        </div>
      </div>
      {open && (
        <div className="glass-dark mx-4 mt-2 rounded-3xl p-6 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            <Link onClick={() => setOpen(false)} href="/products" className="border-b border-white/10 py-3 font-carved text-xl text-crystal">{labels.shop}</Link>
            {categories.map((c) => (
              <Link onClick={() => setOpen(false)} key={c.slug} href={`/products?category=${c.slug}`} className="border-b border-white/10 py-3 text-crystal/85">{c.name}</Link>
            ))}
            <Link onClick={() => setOpen(false)} href="/wishlist" className="border-b border-white/10 py-3 text-crystal/85">{labels.wishlist}</Link>
            <a href={healingUrl} className="py-3 text-gold-300">{labels.backToHealing} →</a>
          </nav>
          <LangToggle lang={lang} label={labels.language} className="mt-3 text-crystal" />
        </div>
      )}
    </header>
  );
}
