"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { cart } from "./cart";
import { track } from "../common/Track";

export default function AddToCart({ productId, stock, labels, compact = false }: { productId: number; stock: number; labels: { add: string; added: string; out: string }; compact?: boolean }) {
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  if (stock <= 0)
    return (
      <button disabled className={`btn btn-ghost-dark w-full ${compact ? "!py-2.5 text-sm" : ""}`}>
        {labels.out}
      </button>
    );
  const add = () => {
    cart.add(productId, qty);
    track("shop", "add_to_cart");
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };
  if (compact)
    return (
      <button onClick={add} className="btn btn-gold w-full !py-2.5 text-sm" aria-live="polite">
        {done ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
        {done ? labels.added : labels.add}
      </button>
    );
  return (
    <div className="flex gap-3">
      <div className="flex items-center rounded-full border border-amethyst-300/30">
        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-12 place-items-center text-crystal" aria-label="Decrease quantity"><Minus className="size-4" /></button>
        <span className="w-8 text-center font-semibold text-crystal" aria-live="polite">{qty}</span>
        <button onClick={() => setQty((q) => Math.min(stock, q + 1))} className="grid size-12 place-items-center text-crystal" aria-label="Increase quantity"><Plus className="size-4" /></button>
      </div>
      <button onClick={add} className="btn btn-gold flex-1" aria-live="polite">
        {done ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
        {done ? labels.added : labels.add}
      </button>
    </div>
  );
}
