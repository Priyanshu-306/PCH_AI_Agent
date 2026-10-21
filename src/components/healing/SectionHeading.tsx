import Reveal from "../common/Reveal";

export default function SectionHeading({ eyebrow, title, body, light = false, center = false }: { eyebrow?: string; title: string; body?: string; light?: boolean; center?: boolean }) {
  return (
    <Reveal className={`max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow ${light ? "text-gold-300" : "text-gold-600"}`}>{eyebrow}</p>}
      <h2 className={`mt-3 font-display text-4xl leading-[1.08] font-light text-balance sm:text-6xl ${light ? "text-white" : "text-plum-900"}`}>{title}</h2>
      {body && <p className={`mt-5 text-lg ${light ? "text-white/75" : "text-ink-soft"}`}>{body}</p>}
    </Reveal>
  );
}
