import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

const Body = z.object({
  site: z.enum(["healing", "shop"]),
  type: z.enum(["page_view", "add_to_cart", "checkout_start", "booking_start"]).default("page_view"),
  path: z.string().max(500),
  referrer: z.string().max(500).optional().nullable(),
});

function device(ua: string) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview/i;

export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return new Response(null, { status: 204 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const { site, type, path, referrer } = parsed.data;
  const url = new URL(path, "http://x");
  const ownHost = (r: string) => /pureconscioushealing|purecrystalhub|localhost/.test(r);
  await db.insert(analyticsEvents).values({
    site,
    type,
    path: url.pathname.slice(0, 300),
    referrer: referrer && !ownHost(referrer) ? referrer.slice(0, 300) : null,
    utmSource: url.searchParams.get("utm_source"),
    utmMedium: url.searchParams.get("utm_medium"),
    utmCampaign: url.searchParams.get("utm_campaign"),
    visitorId: (await cookies()).get("pch_vid")?.value ?? "anon",
    device: device(ua),
  });
  return new Response(null, { status: 204 });
}
