import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getDict } from "@/i18n/server";
import { getContent } from "@/lib/content";
import Reveal from "@/components/common/Reveal";

export const metadata: Metadata = { title: "Meet the Founder" };

export default async function AboutPage() {
  const { lang, t } = await getDict();
  const c = await getContent("healing", lang);
  return (
    <section data-scene="founder" className="pt-36 pb-10 sm:pt-44">
      <div className="container-x grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal className="relative mx-auto w-full max-w-md lg:sticky lg:top-28">
          <div className="absolute -inset-6 rounded-[48px] bg-gradient-to-br from-gold-300/50 via-lavender-300/50 to-rose-300/40 blur-2xl" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] border border-white/70 bg-gradient-to-br from-lavender-200 to-sand-200 shadow-card">
            {c("founder.image") ? <img src={c("founder.image")} alt="" className="size-full object-cover" /> : <span className="grid size-full place-items-center font-display text-[9rem] font-light text-plum-700/30">PC</span>}
          </div>
        </Reveal>
        <div>
          <Reveal><p className="eyebrow text-gold-600">{t.healing.meetFounder}</p></Reveal>
          <Reveal delay={100}><h1 className="mt-4 font-display text-5xl leading-[1.02] font-light text-plum-900 sm:text-7xl">{c("founder.title")}</h1></Reveal>
          <Reveal delay={150}><p className="mt-3 font-semibold text-gold-600">{c("founder.role")}</p></Reveal>
          <Reveal delay={200} className="prose-soft mt-8 text-lg leading-relaxed text-ink">
            {c("founder.story").split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
          </Reveal>
          <Reveal delay={250}>
            <blockquote className="mt-10 border-l-2 border-gold-500 pl-6 font-display text-3xl leading-snug text-plum-800 italic">{c("founder.quote")}</blockquote>
          </Reveal>
          <Reveal delay={300} className="mt-10 flex flex-wrap gap-3">
            <Link href="/book" className="btn btn-primary">{t.nav.book} <ArrowRight className="size-4" /></Link>
            <Link href="/trainers" className="btn btn-ghost">{t.nav.trainers}</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
