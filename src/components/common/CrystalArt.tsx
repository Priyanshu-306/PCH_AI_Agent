import { useId } from "react";
import { crystalTone } from "@/lib/crystal-colors";

type Props = { crystals?: string | null; category?: string | null; className?: string; dark?: boolean };

// Faceted SVG illustration used wherever a product has no photo yet.
export default function CrystalArt({ crystals, category, className = "", dark = false }: Props) {
  const id = useId().replace(/:/g, "");
  const t = crystalTone(crystals);
  const rainbow = (crystals ?? "").toLowerCase().includes("chakra");
  const cat = (category ?? "").toLowerCase();
  const shape = cat.includes("bracelet")
    ? "bracelet"
    : cat.includes("mala")
      ? "mala"
      : cat.includes("tumble")
        ? "tumble"
        : cat.includes("pyramid")
          ? "pyramid"
          : cat.includes("sphere")
            ? "sphere"
            : cat.includes("tree")
              ? "tree"
              : cat.includes("pendant")
                ? "pendant"
                : cat.includes("tower") || cat.includes("point") || cat.includes("angel")
                  ? "point"
                  : "cluster";
  const chakra = ["#d94040", "#f08a3c", "#f2c53d", "#5fbf7a", "#46a8e0", "#5a5fd6", "#b07ae0"];

  const point = (x: number, y: number, w: number, h: number, rot = 0, k = 0) => (
    <g key={`${x}-${y}-${k}`} transform={`rotate(${rot} ${x} ${y + h})`}>
      <polygon points={`${x},${y} ${x + w / 2},${y + h * 0.28} ${x + w / 2},${y + h} ${x},${y + h}`} fill={`url(#${id}a)`} />
      <polygon points={`${x},${y} ${x - w / 2},${y + h * 0.28} ${x - w / 2},${y + h} ${x},${y + h}`} fill={`url(#${id}b)`} />
      <polygon points={`${x},${y} ${x + w / 2},${y + h * 0.28} ${x + w * 0.12},${y + h * 0.34} ${x - w / 2},${y + h * 0.28}`} fill={t.light} opacity={0.75} />
      <line x1={x} y1={y} x2={x} y2={y + h} stroke="#fff" strokeOpacity={0.35} strokeWidth={1.2} />
    </g>
  );

  const beads = (n: number, r: number, cx = 200, cy = 205, br = 22) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const fill = rainbow ? chakra[i % 7] : undefined;
      return (
        <g key={i}>
          <circle cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r * 0.82} r={br} fill={fill ?? `url(#${id}r)`} />
          <circle cx={cx + Math.cos(a) * r - br * 0.35} cy={cy + Math.sin(a) * r * 0.82 - br * 0.35} r={br * 0.28} fill="#fff" opacity={0.6} />
        </g>
      );
    });

  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={`${crystals ?? "Crystal"} illustration`}>
      <defs>
        <radialGradient id={`${id}bg`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor={dark ? "#3a2760" : "#ffffff"} />
          <stop offset="100%" stopColor={dark ? "#160d27" : t.light} stopOpacity={dark ? 1 : 0.55} />
        </radialGradient>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.light} />
          <stop offset="100%" stopColor={t.base} />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={t.base} />
          <stop offset="100%" stopColor={t.deep} />
        </linearGradient>
        <radialGradient id={`${id}r`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={t.light} />
          <stop offset="60%" stopColor={t.base} />
          <stop offset="100%" stopColor={t.deep} />
        </radialGradient>
        <filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <rect width="400" height="400" fill={`url(#${id}bg)`} />
      <ellipse cx="200" cy="215" rx="120" ry="90" fill={t.base} opacity={dark ? 0.35 : 0.22} filter={`url(#${id}glow)`} />
      <ellipse cx="200" cy="330" rx="110" ry="14" fill={t.deep} opacity={0.18} />

      {shape === "point" && point(200, 70, 120, 255)}
      {shape === "cluster" && [point(150, 150, 70, 175, -24, 1), point(255, 140, 76, 185, 22, 2), point(200, 80, 96, 245, 0, 3), point(120, 225, 48, 100, -48, 4), point(285, 220, 50, 105, 46, 5)]}
      {shape === "pendant" && (
        <>
          <path d="M140 40 Q200 120 260 40" fill="none" stroke={dark ? "#c7a8f0" : "#a4831a"} strokeWidth={3} />
          <circle cx="200" cy="96" r="10" fill="none" stroke={dark ? "#c7a8f0" : "#a4831a"} strokeWidth={4} />
          {point(200, 110, 90, 200, 180 + 0, 0)}
        </>
      )}
      {shape === "pyramid" && (
        <>
          <polygon points="200,80 320,320 200,345" fill={`url(#${id}a)`} />
          <polygon points="200,80 80,320 200,345" fill={`url(#${id}b)`} />
          <line x1="200" y1="80" x2="200" y2="345" stroke="#fff" strokeOpacity={0.4} />
        </>
      )}
      {shape === "sphere" && (
        <>
          <circle cx="200" cy="200" r="120" fill={`url(#${id}r)`} />
          <ellipse cx="160" cy="150" rx="40" ry="24" fill="#fff" opacity={0.45} />
        </>
      )}
      {shape === "tumble" &&
        [
          [140, 230, 70, 52, -12],
          [255, 240, 64, 48, 18],
          [200, 175, 78, 58, 6],
        ].map(([x, y, rx, ry, rot], i) => (
          <g key={i} transform={`rotate(${rot} ${x} ${y})`}>
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={rainbow ? chakra[(i * 2) % 7] : `url(#${id}r)`} />
            <ellipse cx={x - rx * 0.3} cy={y - ry * 0.35} rx={rx * 0.32} ry={ry * 0.18} fill="#fff" opacity={0.55} />
          </g>
        ))}
      {shape === "bracelet" && beads(18, 118)}
      {shape === "mala" && (
        <>
          {beads(30, 120, 200, 180, 13)}
          <path d="M200 280 L200 330" stroke={t.deep} strokeWidth={4} />
          <circle cx="200" cy="345" r="16" fill={t.deep} />
        </>
      )}
      {shape === "tree" && (
        <>
          <path d="M200 330 L200 220 M200 260 L160 200 M200 250 L245 190 M200 230 L195 160" stroke="#8a6a3c" strokeWidth={8} strokeLinecap="round" fill="none" />
          <ellipse cx="200" cy="335" rx="70" ry="16" fill={t.deep} opacity={0.6} />
          {Array.from({ length: 46 }, (_, i) => {
            const a = i * 2.4;
            const r = 30 + (i % 9) * 10;
            return <circle key={i} cx={200 + Math.cos(a) * r * 1.1} cy={170 + Math.sin(a) * r * 0.75} r={7} fill={rainbow ? chakra[i % 7] : `url(#${id}r)`} />;
          })}
        </>
      )}

      {[
        [96, 92, 3],
        [312, 110, 2.5],
        [300, 300, 2],
        [110, 290, 2.2],
      ].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y - r * 4} L${x + r} ${y} L${x} ${y + r * 4} L${x - r} ${y} Z`} fill="#fff" opacity={0.85} />
      ))}
    </svg>
  );
}
