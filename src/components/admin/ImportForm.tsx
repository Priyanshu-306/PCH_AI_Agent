"use client";

import { useActionState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";
import { runImport, type ImportState } from "@/app/admin/actions/products";

export default function ImportForm({ kind }: { kind: "products" | "services" | "marketing" }) {
  const [state, action, pending] = useActionState<ImportState, FormData>(runImport, null);
  return (
    <div className="space-y-5">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="kind" value={kind} />
        <input name="file" type="file" accept=".xlsx" required className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-lavender-100 file:px-3 file:py-2 file:font-semibold file:text-plum-800" />
        <button disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-plum-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />} Import
        </button>
      </form>
      {state && "error" in state && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state && "created" in state && (
        <div className="rounded-xl border border-lavender-200 p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> Import finished: {state.created} created · {state.updated} updated · {state.errors.length} rows with problems</p>
          {state.errors.length > 0 && (
            <ul className="mt-3 max-h-60 space-y-1 overflow-auto text-red-700">
              {state.errors.map((e) => <li key={e.row}>Row {e.row}: {e.message}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
