"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CheckCircle2, CircleAlert } from "lucide-react";

/** Shows ?saved=… or ?error=… flashes set by server actions, then cleans the URL. */
export default function Toast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const saved = params.get("saved");
  const error = params.get("error");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  useEffect(() => {
    if (!saved && !error) return;
    const id = setTimeout(() => {
      setMsg({ text: error ?? (saved === "1" ? "Saved" : saved!), ok: !error });
      const next = new URLSearchParams(params);
      next.delete("saved");
      next.delete("error");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    }, 0);
    return () => clearTimeout(id);
  }, [saved, error, params, pathname, router]);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(id);
  }, [msg]);
  if (!msg) return null;
  return (
    <div role="status" className={`fixed right-4 bottom-4 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${msg.ok ? "bg-emerald-600" : "bg-red-600"}`}>
      {msg.ok ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
      {msg.text}
    </div>
  );
}
