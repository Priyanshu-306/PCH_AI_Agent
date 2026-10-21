"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";

export default function LangToggle({ lang, label, className = "" }: { lang: "en" | "hi"; label: string; className?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `lang=${lang === "en" ? "hi" : "en"};path=/;max-age=31536000;samesite=lax`;
        start(() => router.refresh());
      }}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-opacity ${pending ? "opacity-50" : ""} ${className}`}
      aria-label={lang === "en" ? "हिन्दी में देखें" : "View in English"}
    >
      <Languages className="size-4" aria-hidden />
      {label}
    </button>
  );
}
