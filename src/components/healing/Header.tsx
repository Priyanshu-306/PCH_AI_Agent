"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import LangToggle from "../common/LangToggle";

type Props = {
  lang: "en" | "hi";
  logo: string;
  labels: { services: string; courses: string; trainers: string; about: string; crystals: string; contact: string; book: string; language: string };
  shopUrl: string;
};

export default function Header({ lang, logo, labels, shopUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const on = () => setScrolled(scrollY > 24);
    const id = requestAnimationFrame(on);
    addEventListener("scroll", on, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      removeEventListener("scroll", on);
    };
  }, []);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const links = [
    { href: "/services", label: labels.services },
    { href: "/courses", label: labels.courses },
    { href: "/trainers", label: labels.trainers },
    { href: "/about", label: labels.about },
    { href: shopUrl, label: labels.crystals, external: true },
    { href: "/contact", label: labels.contact },
  ];

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || open ? "py-2" : "py-4"}`}>
      <div className="container-x">
        <div className={`flex items-center justify-between gap-4 rounded-full px-4 py-2 transition-all duration-500 sm:px-6 ${scrolled || open ? "glass !bg-white/80 shadow-card" : ""}`}>
          <Link href="/" className="flex items-center gap-2.5" aria-label="Pure Conscious Healing — home">
            {logo ? (
              <img src={logo} alt="Pure Conscious Healing" className="h-10 w-auto" />
            ) : (
              <>
                <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-plum-700 to-lavender-400 text-white shadow-glow">
                  <Sparkles className="size-4" />
                </span>
                <span className="leading-none">
                  <span className="block font-display text-xl font-semibold tracking-wide whitespace-nowrap text-plum-800">Pure Conscious</span>
                  <span className="eyebrow block text-[0.6rem] text-gold-600">Healing</span>
                </span>
              </>
            )}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {links.map((l) =>
              l.external ? (
                <a key={l.href} href={l.href} className="rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-plum-700">
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition hover:text-plum-700 ${pathname.startsWith(l.href) ? "text-plum-700" : "text-ink-soft"}`}
                >
                  {l.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <LangToggle lang={lang} label={labels.language} className="text-plum-700 hover:bg-white/60" />
            <Link href="/book" className="btn btn-primary hidden !px-5 !py-2.5 sm:inline-flex">
              {labels.book}
            </Link>
            <button className="grid size-11 place-items-center rounded-full text-plum-800 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 top-[68px] z-40 transition-all duration-500 lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}>
        <div className="glass mx-4 mt-2 rounded-3xl p-6 shadow-card">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-lavender-200/70 py-3.5 font-display text-2xl text-plum-800 last:border-0"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <Link href="/book" onClick={() => setOpen(false)} className="btn btn-primary mt-5 w-full">
            {labels.book}
          </Link>
        </div>
      </div>
    </header>
  );
}
