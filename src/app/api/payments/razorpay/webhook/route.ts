import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, orders } from "@/db/schema";
import { verifyWebhook } from "@/lib/payments";
import { confirmBookingPayment, confirmOrderPayment } from "@/lib/checkout";
import { signPayment } from "@/lib/payments";

// Backup path for payments where the customer closed the browser before the redirect.
// Configure in Razorpay Dashboard › Webhooks with event payment.captured.
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhook(raw, request.headers.get("x-razorpay-signature"))) return new Response("invalid", { status: 400 });
  const event = JSON.parse(raw);
  if (event.event !== "payment.captured") return new Response("ignored");
  const p = event.payload?.payment?.entity as { id: string; order_id: string } | undefined;
  if (!p) return new Response("ignored");
  const sig = signPayment(p.order_id, p.id);
  const [o] = await db.select({ number: orders.number }).from(orders).where(eq(orders.razorpayOrderId, p.order_id));
  if (o) await confirmOrderPayment(o.number, p.id, sig);
  const [b] = await db.select({ number: bookings.number }).from(bookings).where(eq(bookings.razorpayOrderId, p.order_id));
  if (b) await confirmBookingPayment(b.number, p.id, sig);
  return new Response("ok");
}
