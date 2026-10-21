"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Film } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

type Props = { video: string; images: string[]; title: string; body: string };

/**
 * The healing-space story: a pinned frame whose video is scrubbed by scroll.
 * For smooth scrubbing, encode videos with frequent keyframes (see README › Media).
 */
export default function ScrollVideo({ video, images, title, body }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || !frame.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        frame.current,
        { clipPath: "inset(12% 14% 12% 14% round 40px)", scale: 0.92 },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "40% top", scrub: true },
        },
      );
      gsap.utils.toArray<HTMLElement>("[data-pane]").forEach((pane, i) => {
        gsap.fromTo(pane, { opacity: 0, y: 40 }, { opacity: 1, y: 0, scrollTrigger: { trigger: el, start: `${25 + i * 22}% top`, end: `${38 + i * 22}% top`, scrub: true } });
      });
      const v = vid.current;
      if (v) {
        const setup = () =>
          ScrollTrigger.create({
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            onUpdate: (self) => {
              if (v.duration) v.currentTime = self.progress * (v.duration - 0.05);
            },
          });
        if (v.readyState >= 1) setup();
        else v.addEventListener("loadedmetadata", setup, { once: true });
      }
    }, el);
    return () => ctx.revert();
  }, [video]);

  return (
    <div ref={wrap} className="relative h-[260vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div ref={frame} className="absolute inset-0 bg-plum-900">
          {video ? (
            <video ref={vid} src={video} muted playsInline preload="auto" className="size-full object-cover" />
          ) : images.length ? (
            <div className="grid size-full grid-cols-3 gap-1">
              {images.map((src) => (
                <img key={src} src={src} alt="" className="size-full object-cover" />
              ))}
            </div>
          ) : (
            <div className="relative grid size-full place-items-center overflow-hidden bg-[radial-gradient(circle_at_30%_30%,#cdb9ea,transparent_55%),radial-gradient(circle_at_75%_70%,#ecd48a,transparent_50%),linear-gradient(135deg,#432c6b,#74559f)]">
              <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,.25),transparent_45%)]" />
              <div className="relative flex flex-col items-center gap-3 text-center text-white/85">
                <Film className="size-10" aria-hidden />
                <p className="eyebrow">Healing space video</p>
                <p className="max-w-xs text-sm text-white/70">Upload the studio walkthrough in Admin › Content › Healing space.</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-plum-900/80 via-plum-900/10 to-transparent" />
        </div>
        <div className="container-x relative flex h-full flex-col justify-end pb-16 text-white sm:pb-24">
          <div data-pane className="max-w-2xl">
            <h2 className="font-display text-5xl leading-[1.05] font-light sm:text-7xl">{title}</h2>
          </div>
          <div data-pane className="mt-5 max-w-xl text-lg text-white/85">
            {body}
          </div>
        </div>
      </div>
    </div>
  );
}
