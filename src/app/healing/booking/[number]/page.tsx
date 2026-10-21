import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CalendarCheck2, CircleAlert } from "lucide-react";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { accessToken } from "@/lib/checkout";
import { fmtDateTime, inr } from "@/lib/format";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Your booking", robots: { index: false } };

export default async function BookingConfirmation({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params;
  if ((await searchParams).t !== accessToken(number)) notFound();
  const [b] = await db.select().from(bookings).where(eq(bookings.number, number));
  if (!b) notFound();
  const { t } = await getDict();
  const cfg = await getSetting("booking");
  const confirmed = b.status === "confirmed" || b.status === "completed";
  return (
    <section data-scene="page" className="pt-36 pb-10 sm:pt-44">
      <div className="container-x max-w-2xl">
        <div className="glass rounded-[32px] p-8 text-center shadow-card sm:p-12">
          {confirmed ? <CalendarCheck2 className="mx-auto size-12 text-emerald-600" /> : <CircleAlert className="mx-auto size-12 text-amber-500" />}
          <h1 className="mt-4 font-display text-4xl text-plum-900 sm:text-5xl">{confirmed ? t.healing.bookingConfirmed : "Payment pending"}</h1>
          <p className="mt-3 text-ink-soft">{t.healing.bookingRef}: <b className="text-plum-800">{b.number}</b></p>
          <dl className="mt-8 grid gap-3 text-left text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-4"><dt className="text-mist">Session</dt><dd className="font-semibold">{b.serviceName}</dd></div>
            <div className="rounded-2xl bg-white/70 p-4"><dt className="text-mist">When (IST)</dt><dd className="font-semibold">{fmtDateTime(b.startsAt)}</dd></div>
            <div className="rounded-2xl bg-white/70 p-4"><dt className="text-mist">Mode</dt><dd className="font-semibold">{b.mode === "online" ? t.common.online : t.common.onsite}</dd></div>
            <div className="rounded-2xl bg-white/70 p-4"><dt className="text-mist">Paid</dt><dd className="font-semibold">{b.price ? `${inr(b.price)} · ${b.paymentStatus}` : "—"}</dd></div>
          </dl>
          {b.mode === "online" && <p className="mt-6 text-sm text-ink-soft">{cfg.onlineNote}</p>}
          <Link href="/" className="btn btn-ghost mt-8">{t.nav.home}</Link>
        </div>
      </div>
    </section>
  );
}
