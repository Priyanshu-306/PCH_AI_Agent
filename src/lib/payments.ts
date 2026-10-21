import "server-only";
import crypto from "node:crypto";

/**
 * Razorpay integration. When keys are not configured, a built-in test checkout is used so the
 * full booking and order flow can be exercised locally; its signatures use AUTH_SECRET.
 */
export const razorpayLive = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const secret = () => (razorpayLive() ? process.env.RAZORPAY_KEY_SECRET! : process.env.AUTH_SECRET || "dev-secret-change-me");

export async function createPaymentOrder(amountRupees: number, receipt: string, notes: Record<string, string> = {}) {
  const amount = Math.round(amountRupees * 100);
  if (!razorpayLive()) {
    return { id: `mock_order_${crypto.randomBytes(8).toString("hex")}`, amount, currency: "INR", keyId: "mock" };
  }
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt, notes }),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return { id: data.id, amount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID! };
}

export const signPayment = (orderId: string, paymentId: string) =>
  crypto.createHmac("sha256", secret()).update(`${orderId}|${paymentId}`).digest("hex");

export function verifyPayment(orderId: string, paymentId: string, signature: string) {
  const expected = signPayment(orderId, paymentId);
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyWebhook(rawBody: string, signature: string | null) {
  const whSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!whSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", whSecret).update(rawBody).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Test-mode only: produce a payment id + signature the verify step will accept. */
export function mockPay(orderId: string) {
  if (razorpayLive() || !orderId.startsWith("mock_order_")) return null;
  const paymentId = `mock_pay_${crypto.randomBytes(8).toString("hex")}`;
  return { paymentId, signature: signPayment(orderId, paymentId) };
}
