"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

type Opt = { value: string; label: string };
type Props = {
  categories: Opt[];
  chakras: Opt[];
  zodiac: Opt[];
  intentions: Opt[];
  labels: { filters: string; category: string; chakra: string; zodiac: string; intention: string; sort: string; clear: string; search: string; price: string; sorts: Opt[] };
};

/** URL-driven filters: every change updates the query string and the server re-renders results. */
export default function Filters({ categories, chakras, zodiac, intentions, labels }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("focus") === "search") search.current?.focus();
  }, [params]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.delete("focus");
    next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/products${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const select = (key: string, label: string, opts: Opt[]) => (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold tracking-wider text-crystal/55 uppercase">{label}</span>
      <select value={params.get(key) ?? ""} onChange={(e) => set(key, e.target.value)} className="field field-dark !py-2.5 text-sm">
        <option value="">All</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value} className="bg-night-900">{o.label}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="rounded-[24px] border border-white/10 bg-night-800/70 p-4 sm:p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          set("q", search.current?.value.trim() ?? "");
        }}
        className="relative"
        role="search"
      >
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-crystal/50" />
        <input ref={search} defaultValue={params.get("q") ?? ""} placeholder={labels.search} className="field field-dark !pl-11" aria-label={labels.search} />
      </form>
      <details className="group mt-4" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-crystal/80 lg:hidden">
          <SlidersHorizontal className="size-4" /> {labels.filters}
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:mt-0 lg:grid-cols-6">
          {select("category", labels.category, categories)}
          {select("intention", labels.intention, intentions)}
          {select("chakra", labels.chakra, chakras)}
          {select("zodiac", labels.zodiac, zodiac)}
          {select("price", labels.price, [
            { value: "0-999", label: "Under ₹1,000" },
            { value: "1000-1999", label: "₹1,000 – ₹1,999" },
            { value: "2000-", label: "₹2,000+" },
          ])}
          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold tracking-wider text-crystal/55 uppercase">{labels.sort}</span>
            <select value={params.get("sort") ?? ""} onChange={(e) => set("sort", e.target.value)} className="field field-dark !py-2.5 text-sm">
              {labels.sorts.map((o) => (
                <option key={o.value} value={o.value} className="bg-night-900">{o.label}</option>
              ))}
            </select>
          </label>
        </div>
        {params.size > 0 && (
          <button type="button" onClick={() => router.replace("/products", { scroll: false })} className="mt-3 text-sm font-semibold text-gold-300 hover:underline">
            {labels.clear}
          </button>
        )}
      </details>
    </div>
  );
}
