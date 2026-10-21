import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getDict } from "@/i18n/server";
import { getContent } from "@/lib/content";
import { sessionServices } from "@/lib/queries";
import PageHero from "@/components/healing/PageHero";
import ServiceCard from "@/components/healing/ServiceCard";
import Reveal from "@/components/common/Reveal";

export const metadata: Metadata = { title: "Healing Services" };

export default async function ServicesPage() {
  const { lang, t } = await getDict();
  const [c, sessions] = await Promise.all([getContent("healing", lang), sessionServices()]);
  return (
    <>
      <PageHero eyebrow={t.nav.services} title={c("services.title")} body={c("services.subtitle")}>
        <Link href="/book" className="btn btn-primary">{t.nav.book} <ArrowRight className="size-4" /></Link>
      </PageHero>
      <section data-scene="services" className="pb-10">
        <div className="container-x grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 100} className="h-full">
              <ServiceCard s={s} lang={lang} t={t} index={i} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
