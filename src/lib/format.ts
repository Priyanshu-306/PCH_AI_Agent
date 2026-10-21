export const TZ = "Asia/Kolkata";

export function inr(value: number | string | null | undefined, opts: { decimals?: boolean } = {}) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts.decimals ? 2 : 0,
    minimumFractionDigits: opts.decimals ? 2 : 0,
  }).format(n);
}

export function fmtDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: TZ, ...opts }).format(new Date(d));
}

export function fmtDateTime(d: Date | string) {
  return fmtDate(d, { dateStyle: "medium", timeStyle: "short" });
}

export function fmtTime(d: Date | string) {
  return fmtDate(d, { hour: "numeric", minute: "2-digit" });
}

/** "YYYY-MM-DD" for a Date in IST. */
export function istDay(d: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** Date for an IST wall-clock time. India has no DST, so the offset is fixed. */
export function istDate(day: string, time = "00:00") {
  return new Date(`${day}T${time}:00+05:30`);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 150);
}

export const splitList = (s: string | null | undefined) =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function minutesLabel(min: number | null | undefined) {
  if (!min) return "";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Human-friendly unique reference like PCH-241021-7K3Q. */
export function makeRef(prefix: string) {
  const day = istDay().slice(2).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${day}-${rand}`;
}
