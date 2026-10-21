import "server-only";
import { and, eq, gte, inArray, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { availability, blockedDates, bookings } from "@/db/schema";
import { getSetting } from "./settings";
import { istDate, istDay } from "./format";

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Open start times ("HH:MM", IST) for a service of `durationMin` on `day` (YYYY-MM-DD). */
export async function openSlots(day: string, durationMin: number) {
  const cfg = await getSetting("booking");
  const today = istDay();
  const maxDay = istDay(new Date(Date.now() + cfg.maxDaysAhead * 86400000));
  if (day < today || day > maxDay) return [];

  const [blocked] = await db.select().from(blockedDates).where(eq(blockedDates.day, day));
  if (blocked) return [];

  const weekday = istDate(day, "12:00").getUTCDay();
  const windows = await db.select().from(availability).where(eq(availability.weekday, weekday));
  if (!windows.length) return [];

  const dayStart = istDate(day);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const holdCutoff = new Date(Date.now() - cfg.holdMinutes * 60000);
  const taken = await db
    .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt })
    .from(bookings)
    .where(
      and(
        gte(bookings.startsAt, dayStart),
        lt(bookings.startsAt, dayEnd),
        or(
          inArray(bookings.status, ["confirmed", "completed"]),
          and(eq(bookings.status, "pending"), gte(bookings.createdAt, holdCutoff)),
        ),
      ),
    );

  const earliest = Date.now() + cfg.minLeadHours * 3600000;
  const slots: string[] = [];
  for (const w of windows) {
    for (let m = toMin(w.startTime); m + durationMin <= toMin(w.endTime); m += cfg.slotStepMinutes) {
      const start = istDate(day, toHHMM(m));
      const end = new Date(start.getTime() + durationMin * 60000);
      if (start.getTime() < earliest) continue;
      if (taken.some((b) => start < b.endsAt && end > b.startsAt)) continue;
      slots.push(toHHMM(m));
    }
  }
  return [...new Set(slots)].sort();
}
