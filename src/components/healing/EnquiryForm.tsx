"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitEnquiry, type FormState } from "@/app/actions/public";

type Labels = { name: string; email: string; phone: string; message: string; send: string; sending: string; thankYou: string; sent: string };
type Batch = { id: number; label: string };

export default function EnquiryForm({
  kind,
  site = "healing",
  serviceId,
  batches = [],
  labels,
  dark = false,
}: {
  kind: "course" | "contact";
  site?: "healing" | "shop";
  serviceId?: number;
  batches?: Batch[];
  labels: Labels;
  dark?: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitEnquiry, null);
  const field = `field ${dark ? "field-dark" : ""}`;
  if (state?.ok)
    return (
      <div className={`rounded-3xl p-8 text-center ${dark ? "glass-dark text-crystal" : "glass"}`} role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="mt-3 font-display text-3xl">{labels.thankYou}</p>
        <p className={`mt-2 ${dark ? "text-white/70" : "text-ink-soft"}`}>{labels.sent}</p>
      </div>
    );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="site" value={site} />
      {serviceId && <input type="hidden" name="serviceId" value={serviceId} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {batches.length > 0 && (
        <label className="block">
          <span className="label">Batch</span>
          <select name="batchId" className={field} defaultValue={state?.fields?.batchId ?? batches[0].id}>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
        </label>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">{labels.name} *</span>
          <input name="name" required autoComplete="name" className={field} defaultValue={state?.fields?.name} />
        </label>
        <label className="block">
          <span className="label">{labels.phone} *</span>
          <input name="phone" required type="tel" autoComplete="tel" inputMode="tel" className={field} defaultValue={state?.fields?.phone} />
        </label>
      </div>
      <label className="block">
        <span className="label">{labels.email}</span>
        <input name="email" type="email" autoComplete="email" className={field} defaultValue={state?.fields?.email} />
      </label>
      <label className="block">
        <span className="label">{labels.message}</span>
        <textarea name="message" rows={4} className={field} defaultValue={state?.fields?.message} />
      </label>
      {state?.error && <p className="text-sm font-medium text-red-600" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full sm:w-auto">
        <Send className="size-4" /> {pending ? labels.sending : labels.send}
      </button>
    </form>
  );
}
