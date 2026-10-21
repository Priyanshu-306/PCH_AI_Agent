"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Table2 } from "lucide-react";

import { SERIES } from "./chart-colors";

type Series = { name: string; values: number[] };
/** Formats are named (not functions) so server components can pass them to these client charts. */
export type Fmt = "inr" | "inrCompact" | "number" | "compact";

// Hand-rolled so server and browser render identical text (ICU compact notation differs by runtime).
function short(n: number) {
  const a = Math.abs(n);
  const [d, s] = a >= 1e7 ? [1e7, "Cr"] : a >= 1e5 ? [1e5, "L"] : a >= 1e3 ? [1e3, "K"] : [1, ""];
  const v = n / d;
  return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, "")}${s}`;
}

function fmt(kind: Fmt, n: number) {
  if (kind === "inr") return `₹${Math.round(n).toLocaleString("en-IN")}`;
  if (kind === "inrCompact") return `₹${short(n)}`;
  if (kind === "number") return Math.round(n).toLocaleString("en-IN");
  return short(n);
}

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/** Tracks an element's rendered width so SVG text stays at a constant pixel size. */
function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function TableToggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => set(!on)} aria-pressed={on} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-lavender-50">
      <Table2 className="size-3.5" /> {on ? "Chart" : "Table"}
    </button>
  );
}

/** Multi-series line chart on one y-axis, with crosshair tooltip, end labels and a table view. */
export function LineChart({ labels, series, format: kind = "compact", height = 240 }: { labels: string[]; series: Series[]; format?: Fmt; height?: number }) {
  const format = (n: number) => fmt(kind, n);
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<SVGSVGElement>(null);
  const [wrap, W] = useWidth<HTMLDivElement>(720);
  const pad = { l: 48, r: series.length > 1 ? 120 : 64, t: 12, b: 26 };
  const max = useMemo(() => niceMax(Math.max(1, ...series.flatMap((s) => s.values))), [series]);
  const x = (i: number) => pad.l + (labels.length <= 1 ? 0 : (i / (labels.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / max) * (height - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = Math.max(1, Math.ceil(labels.length / Math.max(3, Math.floor((W - pad.l - pad.r) / 70))));

  const onMove = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };

  // Spread end labels so they never collide.
  const ends = series
    .map((s, k) => ({ k, y: y(s.values.at(-1) ?? 0) }))
    .sort((a, b) => a.y - b.y)
    .map((e, i, arr) => {
      if (i > 0 && e.y - arr[i - 1].y < 14) e.y = arr[i - 1].y + 14;
      return e;
    });

  return (
    <div ref={wrap}>
      <div className="mb-2 flex items-center justify-between gap-2">
        {series.length > 1 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft" aria-label="Legend">
            {series.map((s, k) => (
              <li key={s.name} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES[k] }} />{s.name}</li>
            ))}
          </ul>
        ) : <span />}
        <TableToggle on={table} set={setTable} />
      </div>
      {table ? (
        <DataTable head={["Date", ...series.map((s) => s.name)]} rows={labels.map((l, i) => [l, ...series.map((s) => format(s.values[i] ?? 0))])} />
      ) : (
        <div className="relative">
          <svg ref={box} viewBox={`0 0 ${W} ${height}`} width={W} height={height} className="block max-w-full touch-none select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={series.map((s) => s.name).join(", ")}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#ece6f4" strokeWidth={1} />
                <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="fill-[#8a7f9c] text-[11px]">{format(t)}</text>
              </g>
            ))}
            {labels.map((l, i) => (i % every === 0 || i === labels.length - 1) && (
              <text key={i} x={x(i)} y={height - 6} textAnchor="middle" className="fill-[#8a7f9c] text-[11px]">{l}</text>
            ))}
            {series.map((s, k) => (
              <polyline key={s.name} fill="none" stroke={SERIES[k]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
            ))}
            {ends.map(({ k, y: ly }) => (
              <text key={k} x={W - pad.r + 8} y={ly + 4} className="fill-[#2a2140] text-[11px] font-semibold">
                {format(series[k].values.at(-1) ?? 0)} <tspan className="fill-[#5a4f6e] font-normal">{series.length > 1 ? series[k].name : ""}</tspan>
              </text>
            ))}
            {hover != null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={height - pad.b} stroke="#5a4f6e" strokeWidth={1} strokeDasharray="3 3" />
                {series.map((s, k) => (
                  <circle key={k} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} fill={SERIES[k]} stroke="#fff" strokeWidth={2} />
                ))}
              </g>
            )}
          </svg>
          {hover != null && (
            <div className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-xl border border-lavender-200 bg-white px-3 py-2 text-xs shadow-lg" style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 72px), calc(100% - 150px))` }}>
              <p className="mb-1 text-ink-soft">{labels[hover]}</p>
              {series.map((s, k) => (
                <p key={s.name} className="flex items-center gap-2">
                  <span className="h-0.5 w-3 rounded" style={{ background: SERIES[k] }} />
                  <b className="text-ink tabular-nums">{format(s.values[hover] ?? 0)}</b>
                  <span className="text-ink-soft">{s.name}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars with direct value labels and per-bar hover. */
export function BarList({ items, format: kind = "number", color = SERIES[0], empty = "No data yet" }: { items: { label: string; value: number; hint?: string }[]; format?: Fmt; color?: string; empty?: string }) {
  const format = (n: number) => fmt(kind, n);
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-6 text-center text-sm text-ink-soft">{empty}</p>;
  return (
    <div>
      <div className="mb-2 flex justify-end"><TableToggle on={table} set={setTable} /></div>
      {table ? (
        <DataTable head={["Item", "Value"]} rows={items.map((i) => [i.label, format(i.value)])} />
      ) : (
        <ul className="space-y-2.5" aria-describedby={id}>
          {items.map((it, i) => (
            <li key={it.label} tabIndex={0} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className="group outline-none">
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-ink">{it.label}</span>
                <span className="shrink-0 font-semibold text-ink tabular-nums">{format(it.value)}{it.hint && <span className="ml-1.5 text-xs font-normal text-ink-soft">{it.hint}</span>}</span>
              </div>
              <div className="h-2 rounded-full bg-lavender-50">
                <div className="h-2 rounded-full transition-[filter]" style={{ width: `${Math.max(2, (it.value / max) * 100)}%`, background: color, filter: hover === i ? "brightness(1.12)" : undefined, outline: hover === i ? `2px solid ${color}33` : undefined }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-xl border border-lavender-100">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-lavender-50 text-left text-xs text-ink-soft">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-lavender-100">
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`px-3 py-1.5 ${j ? "text-right tabular-nums" : ""}`}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
