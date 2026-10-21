"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/actions/customer";

export default function WishlistButton({ productId, saved: initial, loggedIn }: { productId: number; saved: boolean; loggedIn: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!loggedIn) return router.push(`/account?next=${encodeURIComponent(location.pathname)}`);
        start(async () => {
          const r = await toggleWishlist(productId);
          if ("saved" in r) setSaved(Boolean(r.saved));
        });
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className="grid size-12 shrink-0 place-items-center rounded-full border border-amethyst-300/30 text-crystal transition hover:border-rose-300"
    >
      <Heart className={`size-5 ${saved ? "fill-rose-300 text-rose-300" : ""}`} />
    </button>
  );
}
