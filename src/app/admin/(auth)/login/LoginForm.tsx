"use client";

import { useActionState } from "react";
import { loginStaff } from "@/app/admin/actions/auth";
import type { FormState } from "@/app/actions/public";
import { input } from "@/components/admin/ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginStaff, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-soft">Email</span><input name="email" type="email" required autoComplete="username" className={input} /></label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-soft">Password</span><input name="password" type="password" required autoComplete="current-password" className={input} /></label>
      {state?.error && <p className="text-sm font-medium text-red-600" role="alert">{state.error}</p>}
      <button disabled={pending} className="w-full rounded-xl bg-plum-700 py-3 text-sm font-semibold text-white hover:bg-plum-800 disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
