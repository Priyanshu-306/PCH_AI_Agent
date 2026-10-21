"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
type W = { weekday: number; startTime: string; endTime: string };

export default function AvailabilityEditor({ initial }: { initial: W[] }) {
  const [rows, setRows] = useState(initial);
  const cls = "rounded-lg border border-lavender-200 px-2 py-1.5 text-sm";
  return (
    <div className="divide-y divide-lavender-100">
      {DAYS.map((name, d) => {
        const mine = rows.map((r, i) => ({ ...r, i })).filter((r) => r.weekday === d);
        return (
          <div key={d} className="flex flex-wrap items-center gap-3 py-3">
            <span className="w-28 text-sm font-semibold">{name}</span>
            {mine.length === 0 && <span className="text-sm text-mist">Closed</span>}
            {mine.map((r) => (
              <span key={r.i} className="flex items-center gap-1">
                <input type="time" name={`start_${d}`} value={r.startTime} onChange={(e) => setRows(rows.map((x, k) => (k === r.i ? { ...x, startTime: e.target.value } : x)))} className={cls} aria-label={`${name} start`} />
                –
                <input type="time" name={`end_${d}`} value={r.endTime} onChange={(e) => setRows(rows.map((x, k) => (k === r.i ? { ...x, endTime: e.target.value } : x)))} className={cls} aria-label={`${name} end`} />
                <button type="button" onClick={() => setRows(rows.filter((_, k) => k !== r.i))} aria-label="Remove window" className="text-red-600"><X className="size-4" /></button>
              </span>
            ))}
            <button type="button" onClick={() => setRows([...rows, { weekday: d, startTime: "10:00", endTime: "13:00" }])} className="inline-flex items-center gap-1 text-xs font-semibold text-plum-700"><Plus className="size-3.5" />Add hours</button>
          </div>
        );
      })}
    </div>
  );
}
