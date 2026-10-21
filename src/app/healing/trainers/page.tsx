import type { Metadata } from "next";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import { activeTrainers } from "@/lib/queries";
import PageHero from "@/components/healing/PageHero";
import Reveal from "@/components/common/Reveal";

export const metadata: Metadata = { title: "Our Trainers" };

export default async function TrainersPage() {
  const { lang, t } = await getDict();
  const [c, trainers] = await Promise.all([getContent("healing", lang), activeTrainers()]);
  return (
    <>
      <PageHero eyebrow={t.nav.trainers} title={c("trainers.title")} body={c("trainers.subtitle")} />
      <section data-scene="learn" className="pb-10">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {trainers.map((tr, i) => (
            <Reveal key={tr.id} delay={i * 100} className="glass overflow-hidden rounded-[32px] shadow-card">
              <div className="aspect-[16/10] bg-gradient-to-br from-lavender-300 via-rose-200 to-gold-300">
                {tr.photo ? <img src={tr.photo} alt={tr.name} className="size-full object-cover" /> : <span className="grid size-full place-items-center font-display text-8xl font-light text-white/80">{tr.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>}
              </div>
              <div className="p-7">
                {tr.isFounder && <span className="eyebrow text-gold-600">Founder</span>}
                <h2 className="mt-1 font-display text-4xl text-plum-900">{tr.name}</h2>
                <p className="mt-1 font-semibold text-plum-600">{pick(tr, "title", lang)}</p>
                <p className="mt-4 leading-relaxed text-ink-soft">{pick(tr, "bio", lang)}</p>
                {tr.credentials && <p className="mt-4 text-sm text-mist">{tr.credentials}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
