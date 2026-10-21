"use client";

import { useActionState, useState } from "react";
import { loginCustomer, registerCustomer } from "@/app/actions/customer";
import type { FormState } from "@/app/actions/public";

type Labels = { login: string; register: string; name: string; email: string; phone: string; password: string };

export default function AuthForms({ labels, next }: { labels: Labels; next?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, login, lp] = useActionState<FormState, FormData>(loginCustomer, null);
  const [regState, register, rp] = useActionState<FormState, FormData>(registerCustomer, null);
  const f = "field field-dark";
  return (
    <div className="mx-auto max-w-md rounded-[28px] border border-white/10 bg-night-800/70 p-6 sm:p-8">
      <div className="grid grid-cols-2 rounded-full bg-night-950 p-1 text-sm font-semibold" role="tablist">
        {(["login", "register"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full py-2.5 transition ${mode === m ? "bg-gold-400 text-night-900" : "text-crystal/70"}`}>
            {m === "login" ? labels.login : labels.register}
          </button>
        ))}
      </div>
      {mode === "login" ? (
        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <input name="email" type="email" required autoComplete="email" placeholder={labels.email} className={f} />
          <input name="password" type="password" required autoComplete="current-password" placeholder={labels.password} className={f} />
          {loginState?.error && <p className="text-sm text-rose-300" role="alert">{loginState.error}</p>}
          <button disabled={lp} className="btn btn-gold w-full">{labels.login}</button>
        </form>
      ) : (
        <form action={register} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          <input name="name" required autoComplete="name" placeholder={labels.name} className={f} />
          <input name="email" type="email" required autoComplete="email" placeholder={labels.email} className={f} />
          <input name="phone" type="tel" autoComplete="tel" placeholder={labels.phone} className={f} />
          <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder={`${labels.password} (8+)`} className={f} />
          {regState?.error && <p className="text-sm text-rose-300" role="alert">{regState.error}</p>}
          <button disabled={rp} className="btn btn-gold w-full">{labels.register}</button>
        </form>
      )}
    </div>
  );
}
