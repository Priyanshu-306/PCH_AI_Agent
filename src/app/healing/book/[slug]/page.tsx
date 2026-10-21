import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { gte } from "drizzle-orm";
import { db } from "@/db";
import { availability, blockedDates } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { serviceBySlug } from "@/lib/queries";
import { getSetting } from "@/lib/settings";
import { istDay, minutesLabel } from "@/lib/format";
import PageHero from "@/components/healing/PageHero";
import BookingFlow from "@/components/healing/BookingFlow";

export const metadata: Metadata = { title: "Book a Session" };

export default async function BookService({ params }: { params: Promise<{ slug: string }> }) {
  const s = await serviceBySlug((await params).slug);
  if (!s || !s.bookableOnline || s.type !== "session") notFound();
  const { lang, t } = await getDict();
  const [windows, blocked, cfg] = await Promise.all([
    db.select({ weekday: availability.weekday }).from(availability),
    db.select({ day: blockedDates.day }).from(blockedDates).where(gte(blockedDates.day, istDay())),
    getSetting("booking"),
  ]);
  const name = pick(s, "name", lang);
  return (
    <>
      <PageHero eyebrow={t.nav.book} title={name} body={`${minutesLabel(s.durationMinutes)} · ${pick(s, "short", lang)}`} />
      <section className="pb-10">
        <div className="container-x">
          <BookingFlow
            service={{ slug: s.slug, name, price: Number(s.price ?? 0), duration: s.durationMinutes ?? 60, mode: s.mode, accent: s.accent }}
            openWeekdays={[...new Set(windows.map((w) => w.weekday))]}
            blockedDays={blocked.map((b) => b.day)}
            maxDays={cfg.maxDaysAhead}
            today={istDay()}
            lang={lang}
            labels={{
              chooseDate: t.healing.chooseDate,
              chooseTime: t.healing.chooseTime,
              yourDetails: t.healing.yourDetails,
              concern: t.healing.concern,
              noSlots: t.healing.noSlots,
              payAndBook: t.healing.payAndBook,
              name: t.common.name,
              email: t.common.email,
              phone: t.common.phone,
              online: t.common.online,
              onsite: t.common.onsite,
              mode: t.healing.mode,
              total: t.shop.total,
              confirmFree: lang === "hi" ? "बुकिंग पक्की करें" : "Confirm booking",
            }}
          />
          {s.mode !== "onsite" && <p className="mt-6 max-w-2xl text-sm text-ink-soft">{cfg.onlineNote}</p>}
        </div>
      </section>
    </>
  );
}
