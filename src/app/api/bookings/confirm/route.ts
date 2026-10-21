import { confirmBookingPayment } from "@/lib/checkout";

export async function POST(request: Request) {
  const b = (await request.json().catch(() => ({}))) as { number?: string; paymentId?: string; signature?: string };
  if (!b.number || !b.paymentId || !b.signature) return Response.json({ error: "Missing payment details" }, { status: 400 });
  const result = await confirmBookingPayment(b.number, b.paymentId, b.signature);
  return Response.json(result, { status: "error" in result ? 400 : 200 });
}
