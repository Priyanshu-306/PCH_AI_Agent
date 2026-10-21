"use client";

import { useSyncExternalStore } from "react";

export type Quality = { tier: "high" | "low"; reducedMotion: boolean; mobile: boolean; webgl: boolean };

let cached: Quality | null = null;

function detect(): Quality {
  if (cached) return cached;
  const mobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  cached = { tier: mobile || weak ? "low" : "high", reducedMotion, mobile, webgl: webglAvailable() };
  return cached;
}

const noop = () => () => {};

/** Rough device capability check used to scale particle counts, DPR and post-processing. Null during SSR. */
export function useQuality(): Quality | null {
  return useSyncExternalStore(noop, detect, () => null);
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
