import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock } from "lucide-react";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { sessionServices } from "@/lib/queries";
import { inr, minutesLabel } from "@/lib/format";
import PageHero from "@/components/healing/PageHero";
import Reveal from "@/components/common/Reveal";

export const metadata: Metadata = { title: "Book a Session" };

export default async function BookIndex() {
  const { lang, t } = await getDict();
  const sessions = (await sessionServices()).filter((s) => s.bookableOnline);
  return (
    <>
      <PageHero eyebrow={t.nav.book} title={lang === "hi" ? "आप किस सेशन के लिए आए हैं?" : "Which session is calling you?"} body={lang === "hi" ? "एक सेवा चुनें, फिर अपनी सुविधा के अनुसार तिथि और समय।" : "Choose a service, then a date and time that suits you."} />
      <section className="pb-10">
        <div className="container-x grid gap-4 md:grid-cols-2">
          {sessions.map((s, i) => (
            <Reveal key={s.id} delay={(i % 2) * 80}>
              <Link href={`/book/${s.slug}`} className="group glass flex items-center gap-5 rounded-[24px] p-5 transition hover:shadow-glow sm:p-6">
                <span className="size-14 shrink-0 rounded-2xl" style={{ background: `radial-gradient(circle at 30% 30%, #fff, ${s.accent})` }} />
                <span className="flex-1">
                  <span className="block font-display text-2xl text-plum-900">{pick(s, "name", lang)}</span>
                  <span className="mt-1 flex items-center gap-3 text-sm text-ink-soft">
                    <Clock className="size-4" /> {minutesLabel(s.durationMinutes)} · {s.price ? inr(s.price) : t.common.priceOnRequest}
                  </span>
                </span>
                <ArrowRight className="size-5 text-plum-600 transition group-hover:translate-x-1" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
