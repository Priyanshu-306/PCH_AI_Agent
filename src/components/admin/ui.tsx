import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-plum-900 sm:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "", pad = true }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-2xl border border-lavender-200 bg-white shadow-[0_1px_2px_rgb(43_27_71/0.04)] ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-lavender-100 px-5 py-3.5">
          {title && <h2 className="text-sm font-bold text-plum-900">{title}</h2>}
          {actions}
        </header>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, icon: Icon, href }: { label: string; value: string; hint?: string; icon?: LucideIcon; href?: string }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{label}</span>
        {Icon && <Icon className="size-4 text-plum-600" aria-hidden />}
      </div>
      <div className="mt-2 text-[1.75rem] leading-none font-bold tracking-tight text-plum-900 tabular-nums">{value}</div>
      {hint && <div className="mt-2 text-xs text-ink-soft">{hint}</div>}
    </>
  );
  const cls = "block rounded-2xl border border-lavender-200 bg-white p-4 transition";
  return href ? <Link href={href} className={`${cls} hover:border-lavender-400`}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

const TONES = {
  gray: "bg-gray-100 text-gray-700",
  plum: "bg-lavender-100 text-plum-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
} as const;

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

const STATUS_TONES: Record<string, keyof typeof TONES> = {
    active: "green", paid: "green", confirmed: "green", delivered: "green", completed: "green", approved: "green", sent: "green", closed: "gray",
    pending: "amber", new: "blue", packed: "plum", shipped: "plum", draft: "gray", contacted: "plum", logged: "gray",
    failed: "red", cancelled: "red", rejected: "red", refunded: "red", out_of_stock: "red", no_show: "red",
};
export const statusTone = (s: string): keyof typeof TONES => STATUS_TONES[s] ?? "gray";

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: string }) {
  const rows = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-lavender-100 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-lavender-100 [&_td]:px-4 [&_td]:py-3 [&_td:first-child]:pl-5 [&_td:last-child]:pr-5">{children}</tbody>
      </table>
      {rows === 0 && <p className="px-5 py-10 text-center text-sm text-ink-soft">{empty ?? "Nothing here yet."}</p>}
    </div>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mist">{hint}</span>}
    </label>
  );
}

export const input = "w-full rounded-xl border border-lavender-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-lavender-500 focus:ring-4 focus:ring-lavender-500/15";

export function Btn({ children, href, variant = "primary", className = "", ...rest }: { children: React.ReactNode; href?: string; variant?: "primary" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: "bg-plum-700 text-white hover:bg-plum-800",
    ghost: "border border-lavender-200 bg-white text-plum-800 hover:bg-lavender-50",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  const cls = `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap transition disabled:opacity-50 ${v} ${className}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...rest}>{children}</button>;
}

export function Filters({ children }: { children: React.ReactNode }) {
  return <form className="mb-4 flex flex-wrap items-end gap-2">{children}</form>;
}

export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <div className="flex items-center justify-end gap-2 border-t border-lavender-100 px-5 py-3 text-sm">
      {page > 1 && <Link className="rounded-lg border border-lavender-200 px-3 py-1.5" href={`${base}${sep}page=${page - 1}`}>Previous</Link>}
      <span className="text-ink-soft">Page {page} of {pages}</span>
      {page < pages && <Link className="rounded-lg border border-lavender-200 px-3 py-1.5" href={`${base}${sep}page=${page + 1}`}>Next</Link>}
    </div>
  );
}
