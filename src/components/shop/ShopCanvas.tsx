"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useQuality } from "../three/quality";
import { sceneState } from "../three/store";

const Hero = dynamic(() => import("../three/ShopScenes").then((m) => m.ShopHeroScene), { ssr: false });
const Viewer = dynamic(() => import("../three/ShopScenes").then((m) => m.ProductViewerScene), { ssr: false });

function usePointer() {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / innerHeight) * 2 - 1);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);
}

export function ShopHero3D({ colors }: { colors: string[] }) {
  const q = useQuality();
  usePointer();
  return q?.webgl ? <Hero q={q} colors={colors} /> : null;
}

export function ProductViewer3D({ color, colors, category }: { color: string; colors: string[]; category: string }) {
  const q = useQuality();
  return q?.webgl ? <Viewer q={q} color={color} colors={colors} category={category} /> : null;
}
