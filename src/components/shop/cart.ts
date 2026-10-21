"use client";

import { useSyncExternalStore } from "react";

// The cart lives in this browser only (a per-visitor convenience). Prices and stock are
// always re-validated on the server at checkout.
export type CartItem = { productId: number; qty: number };
const KEY = "pch_cart_v1";
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache!;
}

function write(items: CartItem[]) {
  cache = items.filter((i) => i.qty > 0);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  listeners.forEach((l) => l());
}

export const cart = {
  add(productId: number, qty = 1) {
    const items = [...read()];
    const found = items.find((i) => i.productId === productId);
    if (found) found.qty = Math.min(99, found.qty + qty);
    else items.push({ productId, qty });
    write(items.map((i) => ({ ...i })));
  },
  set(productId: number, qty: number) {
    write(read().map((i) => (i.productId === productId ? { ...i, qty } : i)));
  },
  remove(productId: number) {
    write(read().filter((i) => i.productId !== productId));
  },
  clear() {
    write([]);
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    removeEventListener("storage", onStorage);
  };
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0);
