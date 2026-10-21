"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { deleteAddress, saveAddress } from "@/app/actions/customer";
import type { FormState } from "@/app/actions/public";

type A = { id: number; name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean };

export default function AddressBook({ list }: { list: A[] }) {
  const [adding, setAdding] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (s, f) => {
    const r = await saveAddress(s, f);
    if (r?.ok) setAdding(false);
    return r;
  }, null);
  const f = "field field-dark";
  return (
    <div className="space-y-3">
      {list.map((a) => (
        <div key={a.id} className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 p-4 text-sm">
          <p className="text-crystal/80"><b className="text-crystal">{a.name}</b> · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}</p>
          <button onClick={() => deleteAddress(a.id)} aria-label="Delete address" className="text-crystal/50 hover:text-rose-300"><Trash2 className="size-4" /></button>
        </div>
      ))}
      {adding ? (
        <form action={action} className="grid gap-3 rounded-2xl border border-white/10 p-4 sm:grid-cols-2">
          <input name="name" required placeholder="Full name" className={f} />
          <input name="phone" required placeholder="Phone" className={f} />
          <input name="line1" required placeholder="Address line 1" className={`${f} sm:col-span-2`} />
          <input name="line2" placeholder="Address line 2" className={`${f} sm:col-span-2`} />
          <input name="city" required placeholder="City" className={f} />
          <input name="pincode" required placeholder="PIN code" inputMode="numeric" className={f} />
          <input name="state" required placeholder="State" className={`${f} sm:col-span-2`} />
          {state?.error && <p className="text-sm text-rose-300 sm:col-span-2">{state.error}</p>}
          <button disabled={pending} className="btn btn-gold sm:col-span-2">Save address</button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="btn btn-ghost-dark"><Plus className="size-4" /> Add address</button>
      )}
    </div>
  );
}
