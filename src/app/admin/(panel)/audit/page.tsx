import { and, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { Badge, Btn, Card, Filters, PageHeader, Pager, input } from "@/components/admin/ui";

export const metadata = { title: "Activity log" };
const PER = 50;

const show = (v: unknown) => (v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

export default async function Audit({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("audit");
  const sp = await searchParams;
  const where: SQL[] = [];
  if (sp.entity) where.push(eq(auditLog.entity, sp.entity));
  if (sp.who) where.push(ilike(auditLog.staffName, `%${sp.who}%`));
  if (sp.q) where.push(ilike(auditLog.summary, `%${sp.q}%`));
  const page = Math.max(1, Number(sp.page ?? 1));
  const [rows, [{ n }], entities] = await Promise.all([
    db.select().from(auditLog).where(and(...where)).orderBy(desc(auditLog.createdAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(auditLog).where(and(...where)),
    db.selectDistinct({ e: auditLog.entity }).from(auditLog),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  return (
    <>
      <PageHeader title="Activity log" subtitle="Every change made in the admin panel: who, what, when — with before and after values." />
      <Filters>
        <select name="entity" defaultValue={sp.entity ?? ""} className={`${input} w-auto`}><option value="">Everything</option>{entities.map(({ e }) => <option key={e}>{e}</option>)}</select>
        <input name="who" defaultValue={sp.who} placeholder="Staff name" className={`${input} max-w-40`} />
        <input name="q" defaultValue={sp.q} placeholder="Search summary" className={`${input} max-w-xs`} />
        <Btn variant="ghost">Apply</Btn>
      </Filters>
      <Card pad={false}>
        <ul className="divide-y divide-lavender-100 text-sm">
          {rows.map((a) => {
            const before = (a.before ?? {}) as Record<string, unknown>;
            const after = (a.after ?? {}) as Record<string, unknown>;
            const keys = a.action === "update" ? [...new Set([...Object.keys(before), ...Object.keys(after)])] : [];
            return (
              <li key={a.id} className="px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span><Badge tone={a.action === "delete" ? "red" : a.action === "create" ? "green" : "plum"}>{a.action}</Badge> <Badge>{a.entity}</Badge> <span className="ml-1">{a.summary}</span></span>
                  <span className="text-xs text-ink-soft">{a.staffName} · {fmtDateTime(a.createdAt)}</span>
                </div>
                {keys.length > 0 && (
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-xs font-semibold text-plum-700">{keys.length} field{keys.length > 1 ? "s" : ""} changed</summary>
                    <table className="mt-2 w-full text-xs">
                      <thead><tr className="text-left text-ink-soft"><th className="py-1 pr-3">Field</th><th className="py-1 pr-3">Before</th><th className="py-1">After</th></tr></thead>
                      <tbody>
                        {keys.map((k) => (
                          <tr key={k} className="align-top"><td className="py-1 pr-3 font-semibold">{k}</td><td className="max-w-sm py-1 pr-3 break-words text-red-700 line-through decoration-red-300">{show(before[k])}</td><td className="max-w-sm py-1 break-words text-emerald-700">{show(after[k])}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                )}
              </li>
            );
          })}
          {!rows.length && <li className="px-5 py-10 text-center text-ink-soft">No activity recorded.</li>}
        </ul>
        <Pager page={page} pages={Math.ceil(n / PER)} base={`/admin/audit${qs ? `?${qs}` : ""}`} />
      </Card>
    </>
  );
}
