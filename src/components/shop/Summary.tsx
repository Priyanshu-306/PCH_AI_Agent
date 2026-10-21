import { inr } from "@/lib/format";
import type { Quote } from "./useQuote";

export type SummaryLabels = { subtotal: string; discount: string; shipping: string; free: string; codFee: string; total: string; inclGst: string };

export default function Summary({ q, labels }: { q: Quote; labels: SummaryLabels }) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between"><dt className="text-crystal/65">{labels.subtotal}</dt><dd>{inr(q.subtotal)}</dd></div>
      {q.discount > 0 && <div className="flex justify-between text-emerald-300"><dt>{labels.discount}{q.coupon ? ` (${q.coupon})` : ""}</dt><dd>−{inr(q.discount, { decimals: true })}</dd></div>}
      <div className="flex justify-between"><dt className="text-crystal/65">{labels.shipping}</dt><dd>{q.shipping ? inr(q.shipping) : labels.free}</dd></div>
      {q.codFee > 0 && <div className="flex justify-between"><dt className="text-crystal/65">{labels.codFee}</dt><dd>{inr(q.codFee)}</dd></div>}
      <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold"><dt>{labels.total}</dt><dd>{inr(q.total, { decimals: q.total % 1 !== 0 })}</dd></div>
      <p className="text-xs text-crystal/45">{labels.inclGst} · GST {inr(q.gstTotal, { decimals: true })}</p>
    </dl>
  );
}
