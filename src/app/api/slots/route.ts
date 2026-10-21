import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { services } from "@/db/schema";
import { openSlots } from "@/lib/slots";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("service") ?? "";
  const day = url.searchParams.get("day") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return Response.json({ slots: [] });
  const [svc] = await db.select().from(services).where(and(eq(services.slug, slug), eq(services.active, true)));
  if (!svc || !svc.bookableOnline) return Response.json({ slots: [] });
  return Response.json({ slots: await openSlots(day, svc.durationMinutes ?? 60) });
}
