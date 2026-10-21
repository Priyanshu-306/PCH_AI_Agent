"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "./cart";

export type Quote = {
  items: { productId: number; slug: string; name: string; nameHi: string | null; crystals: string; image: string | null; qty: number; stock: number; unitPrice: number; mrp: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  coupon: string | null;
  couponError: string | null;
  shipping: number;
  codFee: number;
  gstTotal: number;
  total: number;
  problems: string[];
  codAllowed: boolean;
  whatsappEnabled: boolean;
  freeAbove: number;
};

/** Server-priced view of the local cart (prices, stock, coupon, shipping, GST). */
export function useQuote(items: CartItem[], coupon: string | null, method: "razorpay" | "cod" | "whatsapp" = "razorpay") {
  const [quote, setQuote] = useState<Quote | null>(null);
  const key = JSON.stringify(items);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: JSON.parse(key), coupon, method }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then(setQuote)
      .catch(() => {});
    return () => ctrl.abort();
  }, [key, coupon, method]);
  return quote;
}
