"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Lock, MapPin, Monitor } from "lucide-react";
import { usePayment } from "../common/usePayment";
import { track } from "../common/Track";
import { inr } from "@/lib/format";

type Labels = {
  chooseDate: string; chooseTime: string; yourDetails: string; concern: string; noSlots: string; payAndBook: string;
  name: string; email: string; phone: string; online: string; onsite: string; mode: string; total: string; confirmFree: string;
};

type Props = {
  service: { slug: string; name: string; price: number; duration: number; mode: "online" | "onsite" | "both"; accent: string };
  openWeekdays: number[];
  blockedDays: string[];
  maxDays: number;
  today: string; // YYYY-MM-DD in IST
  labels: Labels;
  lang: "en" | "hi";
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmt12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
};

export default function BookingFlow({ service, openWeekdays, blockedDays, maxDays, today, labels, lang }: Props) {
  const router = useRouter();
  const { pay, modal } = usePayment();
  const start = useMemo(() => new Date(`${today}T00:00:00`), [today]);
  const last = useMemo(() => new Date(start.getTime() + maxDays * 86400000), [start, maxDays]);
  const [month, setMonth] = useState(() => new Date(start.getFullYear(), start.getMonth(), 1));
  const [day, setDay] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [mode, setMode] = useState<"online" | "onsite">(service.mode === "onsite" ? "onsite" : "online");
  const [form, setForm] = useState({ name: "", email: "", phone: "", concern: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!day) return;
    fetch(`/api/slots?service=${service.slug}&day=${day}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots));
  }, [day, service.slug]);

  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  }, [month]);

  const selectable = (d: Date) => d >= start && d <= last && openWeekdays.includes(d.getDay()) && !blockedDays.includes(ymd(d));
  const weekdays = lang === "hi" ? ["सो", "मं", "बु", "गु", "शु", "श", "र"] : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const canPrev = month > new Date(start.getFullYear(), start.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= last;
  const ready = day && time && form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.phone.replace(/\D/g, "").length >= 10;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    track("healing", "booking_start");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: service.slug, day, time, mode, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.payment) {
        const result = await pay(data.payment);
        const conf = await fetch("/api/bookings/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: data.number, ...result }),
        });
        if (!conf.ok) throw new Error((await conf.json()).error);
      }
      router.push(`/booking/${data.number}?t=${data.token}`);
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        {/* Date */}
        <div className="glass rounded-[28px] p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-plum-900">1. {labels.chooseDate}</h2>
            <div className="flex items-center gap-1">
              <button type="button" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-10 place-items-center rounded-full hover:bg-white disabled:opacity-30" aria-label="Previous month"><ChevronLeft className="size-5" /></button>
              <span className="min-w-32 text-center text-sm font-semibold">{month.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" })}</span>
              <button type="button" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-10 place-items-center rounded-full hover:bg-white disabled:opacity-30" aria-label="Next month"><ChevronRight className="size-5" /></button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-mist">
            {weekdays.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {cells.map((d, i) =>
              d ? (
                <button
                  key={i}
                  type="button"
                  disabled={!selectable(d)}
                  onClick={() => {
                    setDay(ymd(d));
                    setSlots(null);
                    setTime(null);
                  }}
                  aria-pressed={day === ymd(d)}
                  className={`aspect-square rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-25 ${day === ymd(d) ? "bg-plum-700 text-white shadow-glow" : "bg-white/60 hover:bg-white"}`}
                >
                  {d.getDate()}
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
        </div>

        {/* Time */}
        <div className={`glass rounded-[28px] p-5 transition sm:p-7 ${day ? "" : "pointer-events-none opacity-50"}`}>
          <h2 className="font-display text-2xl text-plum-900">2. {labels.chooseTime}</h2>
          {day && slots === null && <Loader2 className="mt-5 size-6 animate-spin text-plum-600" />}
          {slots && slots.length === 0 && <p className="mt-4 text-ink-soft">{labels.noSlots}</p>}
          {slots && slots.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s) => (
                <button key={s} type="button" onClick={() => setTime(s)} aria-pressed={time === s} className={`rounded-xl px-2 py-3 text-sm font-semibold transition ${time === s ? "bg-plum-700 text-white" : "bg-white/70 hover:bg-white"}`}>
                  {fmt12(s)}
                </button>
              ))}
            </div>
          )}
          {service.mode === "both" && (
            <div className="mt-6">
              <p className="label">{labels.mode}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["online", "onsite"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${mode === m ? "bg-plum-700 text-white" : "bg-white/70 hover:bg-white"}`}>
                    {m === "online" ? <Monitor className="size-4" /> : <MapPin className="size-4" />}
                    {m === "online" ? labels.online : labels.onsite}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="glass h-fit rounded-[28px] p-5 sm:p-7 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl text-plum-900">3. {labels.yourDetails}</h2>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="label">{labels.name} *</span><input className="field" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block"><span className="label">{labels.email} *</span><input className="field" required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="block"><span className="label">{labels.phone} *</span><input className="field" required type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="block"><span className="label">{labels.concern}</span><textarea className="field" rows={3} value={form.concern} onChange={(e) => setForm({ ...form, concern: e.target.value })} /></label>
        </div>
        <div className="mt-6 rounded-2xl bg-white/70 p-4 text-sm">
          <div className="flex justify-between font-semibold text-plum-900"><span>{service.name}</span><span>{service.price ? inr(service.price) : "—"}</span></div>
          {day && time && <p className="mt-1 text-ink-soft">{new Date(`${day}T${time}:00`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" })} · {fmt12(time)} IST · {mode === "online" ? labels.online : labels.onsite}</p>}
        </div>
        {error && <p className="mt-4 text-sm font-medium text-red-600" role="alert">{error}</p>}
        <button disabled={!ready || busy} className="btn btn-primary mt-5 w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          {service.price ? `${labels.payAndBook} · ${inr(service.price)}` : labels.confirmFree}
        </button>
        <p className="mt-3 text-center text-xs text-mist">Secured by Razorpay · UPI, cards & netbanking</p>
      </div>
      {modal}
    </form>
  );
}
