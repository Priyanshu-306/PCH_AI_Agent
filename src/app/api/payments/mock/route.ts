import { mockPay } from "@/lib/payments";

// Test checkout used when Razorpay keys are not configured.
export async function POST(request: Request) {
  const { orderId, outcome } = (await request.json().catch(() => ({}))) as { orderId?: string; outcome?: string };
  if (outcome === "fail") return Response.json({ error: "Payment declined (test)" }, { status: 402 });
  const result = orderId ? mockPay(orderId) : null;
  if (!result) return Response.json({ error: "Test payments are disabled" }, { status: 400 });
  return Response.json(result);
}
