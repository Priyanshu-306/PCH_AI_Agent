"use client";

import { useState } from "react";
import { Box, Play } from "lucide-react";
import CrystalArt from "../common/CrystalArt";
import Media from "../common/Media";
import { ProductViewer3D } from "./ShopCanvas";

type Props = { images: string[]; video: string | null; name: string; crystals: string; category: string; color: string; colors: string[]; note: string };

/** Photos, video and an interactive 3D preview. Defaults to 3D until real photos exist. */
export default function Gallery({ images, video, name, crystals, category, color, colors, note }: Props) {
  const slides = [...images.map((src) => ({ kind: "img" as const, src })), ...(video ? [{ kind: "video" as const, src: video }] : []), { kind: "3d" as const, src: "" }];
  const [i, setI] = useState(images.length ? 0 : slides.length - 1);
  const cur = slides[i];
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_50%_40%,#3a2468,#160d27_70%)]">
        {cur.kind === "img" && <img src={cur.src} alt={name} className="size-full object-cover" />}
        {cur.kind === "video" && <Media src={cur.src} alt={name} className="size-full object-cover" />}
        {cur.kind === "3d" && (
          <>
            <div className="absolute inset-0 grid place-items-center opacity-40">
              <CrystalArt crystals={crystals} category={category} dark className="size-3/4" />
            </div>
            <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
              <ProductViewer3D color={color} colors={colors} category={category} />
            </div>
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night-950/90 p-4 text-center text-xs text-crystal/60">{note}</p>
          </>
        )}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {slides.map((s, k) => (
          <button key={k} onClick={() => setI(k)} aria-label={s.kind === "3d" ? "3D view" : `Image ${k + 1}`} aria-pressed={i === k} className={`relative size-18 shrink-0 overflow-hidden rounded-2xl border transition ${i === k ? "border-gold-400" : "border-white/10 opacity-70 hover:opacity-100"}`}>
            {s.kind === "img" ? (
              <img src={s.src} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center bg-night-800 text-crystal">{s.kind === "3d" ? <><Box className="size-5" /><span className="sr-only">3D</span></> : <Play className="size-5" />}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
