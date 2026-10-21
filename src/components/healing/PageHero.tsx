import Reveal from "../common/Reveal";

export default function PageHero({ eyebrow, title, body, children }: { eyebrow?: string; title: string; body?: string; children?: React.ReactNode }) {
  return (
    <section data-scene="page" className="relative pt-36 pb-14 sm:pt-44 sm:pb-20">
      <div className="container-x">
        <div className="max-w-3xl">
          {eyebrow && (
            <Reveal>
              <p className="eyebrow text-gold-600">{eyebrow}</p>
            </Reveal>
          )}
          <Reveal delay={100}>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] font-light text-balance text-plum-900 sm:text-7xl">{title}</h1>
          </Reveal>
          {body && (
            <Reveal delay={200}>
              <p className="mt-6 max-w-2xl text-lg text-ink-soft">{body}</p>
            </Reveal>
          )}
          {children && <Reveal delay={300} className="mt-8">{children}</Reveal>}
        </div>
      </div>
    </section>
  );
}
