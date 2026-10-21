import { notFound } from "next/navigation";
import { POLICIES } from "@/lib/policies";
import PageHero from "@/components/healing/PageHero";

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = POLICIES.healing[(await params).slug];
  if (!p) notFound();
  return (
    <>
      <PageHero eyebrow="Pure Conscious Healing" title={p.title} />
      <section className="pb-10">
        <div className="container-x">
          <div className="glass prose-soft max-w-3xl rounded-[28px] p-7 text-lg leading-relaxed sm:p-10">
            {p.body.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>
      </section>
    </>
  );
}
