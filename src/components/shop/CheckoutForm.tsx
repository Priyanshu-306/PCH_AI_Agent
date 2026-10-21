"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, MessageCircle, Truck } from "lucide-react";
import { cart, useCart } from "./cart";
import { useQuote } from "./useQuote";
import Summary, { type SummaryLabels } from "./Summary";
import { usePayment } from "../common/usePayment";
import { track } from "../common/Track";

type Address = { name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string };
type Labels = SummaryLabels & {
  payment: string; payOnline: string; cod: string; whatsapp: string; placeOrder: string; empty: string; continue: string;
  name: string; email: string; phone: string; address: string; address2: string; city: string; state: string; pincode: string; shippingTo: string; notes: string;
};

const STATES = ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

export default function CheckoutForm({ labels, coupon, prefill, saved }: { labels: Labels; coupon: string | null; prefill: { name: string; email: string; phone: string }; saved: Address[] }) {
  const items = useCart();
  const router = useRouter();
  const { pay, modal } = usePayment();
  const [method, setMethod] = useState<"razorpay" | "cod" | "whatsapp">("razorpay");
  const q = useQuote(items, coupon, method);
  const first = saved[0];
  const [f, setF] = useState({
    name: first?.name ?? prefill.name, email: prefill.email, phone: first?.phone ?? prefill.phone,
    line1: first?.line1 ?? "", line2: first?.line2 ?? "", city: first?.city ?? "", state: first?.state ?? "Uttar Pradesh", pincode: first?.pincode ?? "", notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (!items.length)
    return (
      <div className="py-20 text-center">
        <p className="font-carved text-3xl">{labels.empty}</p>
        <Link href="/products" className="btn btn-gold mt-8">{labels.continue}</Link>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    track("shop", "checkout_start");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, items, coupon, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.payment) {
        const result = await pay(data.payment);
        const conf = await fetch("/api/orders/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: data.number, ...result }) });
        if (!conf.ok) throw new Error((await conf.json()).error);
      }
      cart.clear();
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener");
      router.push(`/order/${data.number}?t=${data.token}`);
    } catch (err) {
      setError((err as Error).message || "Something went wrong");
      setBusy(false);
    }
  }

  const methods = [
    { id: "razorpay" as const, label: labels.payOnline, icon: CreditCard, show: q?.onlineEnabled ?? true },
    { id: "cod" as const, label: labels.cod, icon: Truck, show: q?.codAllowed ?? true },
    { id: "whatsapp" as const, label: labels.whatsapp, icon: MessageCircle, show: q?.whatsappEnabled ?? true },
  ].filter((m) => m.show);
  if (q && methods.length && !methods.some((m) => m.id === method)) setTimeout(() => setMethod(methods[0].id), 0);
  const field = "field field-dark";

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-6">
        <fieldset className="rounded-[24px] border border-white/10 bg-night-800/70 p-5 sm:p-6">
          <legend className="px-2 font-carved text-xl">{labels.shippingTo}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="label !text-crystal/60">{labels.name} *</span><input required className={field} autoComplete="name" value={f.name} onChange={up("name")} /></label>
            <label className="block"><span className="label !text-crystal/60">{labels.phone} *</span><input required type="tel" inputMode="tel" autoComplete="tel" className={field} value={f.phone} onChange={up("phone")} /></label>
            <label className="block sm:col-span-2"><span className="label !text-crystal/60">{labels.email} *</span><input required type="email" autoComplete="email" className={field} value={f.email} onChange={up("email")} /></label>
            <label className="block sm:col-span-2"><span className="label !text-crystal/60">{labels.address} *</span><input required autoComplete="address-line1" className={field} value={f.line1} onChange={up("line1")} /></label>
            <label className="block sm:col-span-2"><span className="label !text-crystal/60">{labels.address2}</span><input autoComplete="address-line2" className={field} value={f.line2} onChange={up("line2")} /></label>
            <label className="block"><span className="label !text-crystal/60">{labels.city} *</span><input required autoComplete="address-level2" className={field} value={f.city} onChange={up("city")} /></label>
            <label className="block"><span className="label !text-crystal/60">{labels.pincode} *</span><input required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="postal-code" className={field} value={f.pincode} onChange={up("pincode")} /></label>
            <label className="block sm:col-span-2"><span className="label !text-crystal/60">{labels.state} *</span>
              <select required className={field} value={f.state} onChange={up("state")}>{STATES.map((s) => <option key={s} className="bg-night-900">{s}</option>)}</select>
            </label>
            <label className="block sm:col-span-2"><span className="label !text-crystal/60">{labels.notes}</span><textarea rows={2} className={field} value={f.notes} onChange={up("notes")} /></label>
          </div>
        </fieldset>
        <fieldset className="rounded-[24px] border border-white/10 bg-night-800/70 p-5 sm:p-6">
          <legend className="px-2 font-carved text-xl">{labels.payment}</legend>
          <div className="space-y-2">
            {methods.map(({ id, label, icon: Icon }) => (
              <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${method === id ? "border-gold-400 bg-gold-400/10" : "border-white/10 hover:border-white/25"}`}>
                <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} className="accent-[#e0bf5c]" />
                <Icon className="size-5 text-amethyst-300" />
                <span className="font-medium">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <aside className="h-fit space-y-5 rounded-[24px] border border-white/10 bg-night-800/70 p-5 sm:p-6 lg:sticky lg:top-28">
        {q ? (
          <>
            <ul className="space-y-2 text-sm">
              {q.items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-3"><span className="text-crystal/75">{i.name} × {i.qty}</span><span>{i.lineTotal.toLocaleString("en-IN")}</span></li>
              ))}
            </ul>
            <div className="border-t border-white/10 pt-4"><Summary q={q} labels={labels} /></div>
            {q.problems.map((p) => <p key={p} className="text-sm text-amber-200">{p}</p>)}
          </>
        ) : (
          <Loader2 className="mx-auto size-6 animate-spin" />
        )}
        {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}
        <button disabled={busy || !q || q.problems.length > 0} className="btn btn-gold w-full">
          {busy && <Loader2 className="size-4 animate-spin" />} {labels.placeOrder}
        </button>
        <p className="text-center text-xs text-crystal/45">Secure checkout · Razorpay</p>
      </aside>
      {modal}
    </form>
  );
}
