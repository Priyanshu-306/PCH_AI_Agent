import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { markAllRead } from "@/app/admin/actions/system";
import { Badge, Card, PageHeader, statusTone } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Notifications" };

export default async function Notifications({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  await requireStaff();
  const channel = (await searchParams).channel ?? "in_app";
  const rows = await db.select().from(notifications).where(eq(notifications.channel, channel)).orderBy(desc(notifications.createdAt)).limit(200);
  const tabs = [["in_app", "Alerts"], ["email", "Emails sent"], ["whatsapp", "WhatsApp sent"]];
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="New bookings, orders, enquiries, reviews and low-stock alerts. Email & WhatsApp tabs show every message the system sent (or logged, when no provider is connected)."
        actions={channel === "in_app" ? <form action={markAllRead}><SubmitButton variant="ghost">Mark all read</SubmitButton></form> : undefined}
      />
      <div className="mb-4 flex gap-2 text-sm">
        {tabs.map(([k, l]) => <a key={k} href={`?channel=${k}`} className={`rounded-full px-4 py-1.5 font-semibold ${k === channel ? "bg-plum-700 text-white" : "bg-white text-plum-800 ring-1 ring-lavender-200"}`}>{l}</a>)}
      </div>
      <Card pad={false}>
        <ul className="divide-y divide-lavender-100">
          {rows.map((n) => (
            <li key={n.id} className={`px-5 py-3.5 text-sm ${channel === "in_app" && !n.readAt ? "bg-lavender-50/70" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-plum-900">{channel === "in_app" && !n.readAt && <span className="mr-2 inline-block size-2 rounded-full bg-red-600" aria-label="unread" />}{n.title}</span>
                <span className="flex items-center gap-2 text-xs text-ink-soft"><Badge tone="plum">{n.kind}</Badge>{channel !== "in_app" && <Badge tone={statusTone(n.status)}>{n.status}</Badge>}{fmtDateTime(n.createdAt)}</span>
              </div>
              {n.recipient && <p className="mt-0.5 text-xs text-ink-soft">To {n.recipient}</p>}
              {channel === "email" ? (
                <details className="mt-1"><summary className="cursor-pointer text-xs text-plum-700">Preview email</summary><iframe title={n.title} srcDoc={n.body} sandbox="" className="mt-2 h-96 w-full rounded-xl border border-lavender-200 bg-white" /></details>
              ) : (
                <p className="mt-1 whitespace-pre-line text-ink-soft">{n.body}</p>
              )}
              {n.error && <p className="mt-1 text-xs text-red-700">{n.error}</p>}
              {n.link?.startsWith("/admin") && <Link href={n.link} className="mt-1 inline-block text-xs font-semibold text-plum-700">Open →</Link>}
            </li>
          ))}
          {!rows.length && <li className="px-5 py-10 text-center text-sm text-ink-soft">Nothing yet.</li>}
        </ul>
      </Card>
    </>
  );
}
