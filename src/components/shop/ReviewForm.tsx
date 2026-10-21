"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type FormState } from "@/app/actions/public";

export default function ReviewForm({ productId, labels, defaultName }: { productId: number; labels: { write: string; thanks: string; name: string; submit: string }; defaultName?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, null);
  const [rating, setRating] = useState(5);
  if (state?.ok) return <p className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-300" role="status">{labels.thanks}</p>;
  return (
    <form action={action} className="space-y-3 rounded-[24px] border border-white/10 bg-night-800/70 p-5">
      <p className="font-carved text-xl">{labels.write}</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
            <Star className={`size-7 ${n <= rating ? "fill-gold-400 text-gold-400" : "text-white/25"}`} />
          </button>
        ))}
      </div>
      <input name="name" required defaultValue={defaultName} placeholder={labels.name} className="field field-dark" />
      <input name="title" placeholder="Title (optional)" className="field field-dark" />
      <textarea name="body" required rows={3} placeholder="How has this crystal supported you?" className="field field-dark" />
      {state?.error && <p className="text-sm text-rose-300" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn btn-gold">{labels.submit}</button>
    </form>
  );
}
