"use client";

import { useCallback, useRef, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { inr } from "@/lib/format";

export type PaymentOrder = {
  id: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  name: string;
  prefill: { name: string; email: string; contact: string };
};
type Result = { paymentId: string; signature: string };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay. Check your connection."));
    document.body.appendChild(s);
  });
}

/**
 * Opens Razorpay Checkout, or a clearly-labelled test checkout when the server runs without
 * Razorpay keys. Resolves with the payment id + signature for server-side verification.
 */
export function usePayment() {
  const [mock, setMock] = useState<PaymentOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef<{ resolve: (r: Result) => void; reject: (e: Error) => void } | null>(null);

  const pay = useCallback(async (order: PaymentOrder) => {
    if (order.keyId === "mock") {
      setMock(order);
      return new Promise<Result>((resolve, reject) => (pending.current = { resolve, reject }));
    }
    await loadRazorpay();
    return new Promise<Result>((resolve, reject) => {
      const rz = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        order_id: order.id,
        prefill: order.prefill,
        theme: { color: "#5b3e8c" },
        handler: (r: { razorpay_payment_id: string; razorpay_signature: string }) =>
          resolve({ paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
        modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
      });
      rz.on("payment.failed", () => reject(new Error("Payment failed. Please try again.")));
      rz.open();
    });
  }, []);

  const finish = async (outcome: "success" | "fail" | "cancel") => {
    const p = pending.current;
    const order = mock;
    if (!p || !order) return;
    if (outcome === "cancel") {
      setMock(null);
      return p.reject(new Error("Payment cancelled"));
    }
    setBusy(true);
    const res = await fetch("/api/payments/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, outcome }),
    });
    const data = await res.json();
    setBusy(false);
    setMock(null);
    if (!res.ok) p.reject(new Error(data.error ?? "Payment failed"));
    else p.resolve(data);
  };

  const modal = mock ? (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Test checkout">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-ink shadow-2xl">
        <div className="flex items-center justify-between bg-[#0c2451] px-5 py-4 text-white">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/70">Razorpay · Test mode</div>
            <div className="font-semibold">{mock.name}</div>
          </div>
          <button onClick={() => finish("cancel")} aria-label="Close" className="rounded-full p-1 hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="text-3xl font-bold">{inr(mock.amount / 100)}</div>
          <p className="text-sm text-ink-soft">
            Razorpay keys are not configured yet, so this is a simulated payment. Add <code>RAZORPAY_KEY_ID</code> and{" "}
            <code>RAZORPAY_KEY_SECRET</code> to enable real UPI, card and netbanking payments.
          </p>
          <button disabled={busy} onClick={() => finish("success")} className="btn w-full bg-emerald-600 text-white">
            <ShieldCheck className="size-4" /> Simulate successful payment
          </button>
          <button disabled={busy} onClick={() => finish("fail")} className="btn w-full border border-red-200 text-red-700">
            Simulate failed payment
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { pay, modal };
}
