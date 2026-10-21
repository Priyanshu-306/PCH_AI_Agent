"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function SubmitButton({ children, variant = "primary", className = "", name, value }: { children: React.ReactNode; variant?: "primary" | "ghost" | "danger"; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  const v = {
    primary: "bg-plum-700 text-white hover:bg-plum-800",
    ghost: "border border-lavender-200 bg-white text-plum-800 hover:bg-lavender-50",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button name={name} value={value} disabled={pending} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${v} ${className}`}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
