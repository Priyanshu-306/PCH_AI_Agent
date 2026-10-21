import Link from "next/link";
import { ArrowUpRight, Clock, Monitor, MapPin } from "lucide-react";
import TiltCard from "../common/TiltCard";
import { inr, minutesLabel } from "@/lib/format";
import { pick, type Dict, type Lang } from "@/i18n/dictionaries";
import type { services } from "@/db/schema";

type Service = typeof services.$inferSelect;

export default function ServiceCard({ s, lang, t, index = 0 }: { s: Service; lang: Lang; t: Dict; index?: number }) {
  const mode = s.mode === "both" ? t.common.both : s.mode === "online" ? t.common.online : t.common.onsite;
  return (
    <TiltCard className="h-full">
      <Link
        href={`/services/${s.slug}`}
        className="group glass relative flex h-full flex-col overflow-hidden rounded-[28px] p-6 shadow-card transition-shadow duration-500 hover:shadow-glow sm:p-7"
        style={{ "--accent": s.accent } as React.CSSProperties}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-40 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
          style={{ background: s.accent }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(400px circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,.55), transparent 40%)" }} />
        <div className="relative flex items-start justify-between">
          <span className="font-display text-5xl font-light text-plum-700/40">{String(index + 1).padStart(2, "0")}</span>
          <span className="grid size-10 place-items-center rounded-full border border-lavender-300 text-plum-700 transition group-hover:rotate-45 group-hover:bg-plum-700 group-hover:text-white">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <h3 className="relative mt-6 font-display text-[1.9rem] leading-tight font-medium text-plum-900">{pick(s, "name", lang)}</h3>
        <p className="relative mt-3 flex-1 text-ink-soft">{pick(s, "short", lang)}</p>
        <div className="relative mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
          {s.durationMinutes ? (
            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" style={{ color: s.accent }} />{minutesLabel(s.durationMinutes)}</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">{s.mode === "onsite" ? <MapPin className="size-4" style={{ color: s.accent }} /> : <Monitor className="size-4" style={{ color: s.accent }} />}{mode}</span>
          <span className="ml-auto font-semibold text-plum-800">{s.price != null && Number(s.price) > 0 ? inr(s.price) : s.price === 0 ? "Free" : t.common.priceOnRequest}</span>
        </div>
      </Link>
    </TiltCard>
  );
}
