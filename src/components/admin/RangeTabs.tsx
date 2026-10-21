import Link from "next/link";

export default function RangeTabs({ days, base }: { days: number; base: string }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2 text-sm" role="group" aria-label="Date range">
      {[7, 30, 90, 365].map((d) => (
        <Link key={d} href={`${base}?days=${d}`} aria-current={d === days ? "true" : undefined} className={`rounded-full px-4 py-1.5 font-semibold ${d === days ? "bg-plum-700 text-white" : "bg-white text-plum-800 ring-1 ring-lavender-200"}`}>
          {d === 365 ? "Last 12 months" : `Last ${d} days`}
        </Link>
      ))}
    </div>
  );
}
