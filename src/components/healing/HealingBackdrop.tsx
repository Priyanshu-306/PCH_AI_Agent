"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useQuality } from "../three/quality";
import { sceneState } from "../three/store";

gsap.registerPlugin(ScrollTrigger);

const HealingScene = dynamic(() => import("../three/HealingScene"), { ssr: false });

/**
 * Fixed full-screen WebGL backdrop for the healing site. Sections opt in with
 * data-scene="name"; their on-screen weight drives the 3D choreography.
 */
export default function HealingBackdrop({ crystalColors }: { crystalColors: string[] }) {
  const q = useQuality();
  const pathname = usePathname();

  useEffect(() => {
    const move = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / innerHeight) * 2 - 1);
    };
    addEventListener("pointermove", move, { passive: true });
    return () => removeEventListener("pointermove", move);
  }, []);

  // Re-register triggers on every route change (sections differ per page).
  useEffect(() => {
    sceneState.weights = {};
    const triggers: ScrollTrigger[] = [];
    const id = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => {
        const name = el.dataset.scene!;
        // Bell curve: 0 at the edges, 1 while the section fills the viewport.
        const compute = (self: ScrollTrigger) => {
          const p = self.progress;
          const h = el.offsetHeight;
          const plateau = Math.max(0, (h - innerHeight) / (h + innerHeight));
          const edge = (1 - plateau) / 2;
          const w = p <= 0 || p >= 1 ? 0 : p < edge ? p / edge : p > 1 - edge ? (1 - p) / edge : 1;
          sceneState.weights[name] = Math.max(0, Math.min(1, w)) ** 1.5;
        };
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            onUpdate: compute,
            onRefresh: compute,
            onLeave: () => (sceneState.weights[name] = 0),
            onLeaveBack: () => (sceneState.weights[name] = 0),
          }),
        );
      });
      // The 3D chakra column highlights whichever chakra card is crossing the viewport centre.
      document.querySelectorAll<HTMLElement>("[data-chakra-step]").forEach((el) => {
        const i = Number(el.dataset.chakraStep);
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            start: "top center",
            end: "bottom center",
            onUpdate: (self) => void (sceneState.chakra = i + self.progress),
            onToggle: (self) => self.isActive && (sceneState.chakra = i + self.progress),
          }),
        );
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancelAnimationFrame(id);
      triggers.forEach((t) => t.kill());
    };
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-lavender-100 to-sand-50">
      {q?.webgl && <HealingScene q={q} crystalColors={crystalColors} />}
    </div>
  );
}
