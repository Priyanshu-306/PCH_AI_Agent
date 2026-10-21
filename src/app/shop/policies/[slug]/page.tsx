import { notFound } from "next/navigation";
import { POLICIES } from "@/lib/policies";

export default async function ShopPolicy({ params }: { params: Promise<{ slug: string }> }) {
  const p = POLICIES.shop[(await params).slug];
  if (!p) notFound();
  return (
    <section className="pt-36 pb-10">
      <div className="container-x max-w-3xl">
        <h1 className="font-carved text-5xl">{p.title}</h1>
        <div className="prose-soft mt-8 rounded-[24px] border border-white/10 bg-night-800/70 p-7 text-lg leading-relaxed text-crystal/80 sm:p-10">
          {p.body.map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </div>
    </section>
  );
}
