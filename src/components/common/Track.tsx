"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function track(site: "healing" | "shop", type: string, path?: string) {
  const body = JSON.stringify({ site, type, path: path ?? location.pathname + location.search, referrer: document.referrer || null });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  else fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
}

/** Records a page view on every client-side navigation. */
export default function Track({ site }: { site: "healing" | "shop" }) {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    track(site, "page_view", pathname + (search.size ? `?${search}` : ""));
  }, [site, pathname, search]);
  return null;
}
