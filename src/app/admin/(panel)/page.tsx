import Link from "next/link";
import { and, asc, desc, gte, inArray } from "drizzle-orm";
import { AlertTriangle, CalendarDays, Gem, IndianRupee, MessageSquare, ShoppingCart, Star, Users } from "lucide-react";
import { db } from "@/db";
import { auditLog, bookings, orders } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { kpis, revenueSeries } from "@/lib/stats";
import { fmtDateTime, inr } from "@/lib/format";
import { Badge, Card, PageHeader, Stat, statusTone } from "@/components/admin/ui";
import { LineChart } from "@/components/admin/charts";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireStaff("dashboard");
  const { denied } = await searchParams;
  const [k, rev, upcoming, recent, activity] = await Promise.all([
    kpis(30),
    revenueSeries(30),
    db.select().from(bookings).where(and(gte(bookings.startsAt, new Date()), inArray(bookings.status, ["confirmed", "pending"]))).orderBy(asc(bookings.startsAt)).limit(6),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(8),
  ]);
  const showShop = can(user.role, "orders");
  const showHealing = can(user.role, "bookings");

  return (
    <>
      <PageHeader title={`Namaste, ${user.name.split(" ")[0]}`} subtitle="Here is what is happening across Pure Conscious Healing and Pure Crystal Hub (last 30 days)." />
      {denied && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Your role does not have access to “{denied}”. Ask the owner if you need it.</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {showShop && <Stat label="Shop revenue" value={inr(k.shopRevenue)} hint={`${k.orders} orders`} icon={IndianRupee} href="/admin/orders" />}
        {showHealing && <Stat label="Session revenue" value={inr(k.healingRevenue)} hint={`${k.bookings} bookings`} icon={Gem} href="/admin/bookings" />}
        <Stat label="Visitors" value={k.visitors.toLocaleString("en-IN")} hint={`${k.pageViews.toLocaleString("en-IN")} page views`} icon={Users} href="/admin/analytics" />
        <Stat label="Marketing spend" value={inr(k.spend)} hint={k.spend ? `ROAS ${((k.shopRevenue + k.healingRevenue) / k.spend).toFixed(1)}×` : "No spend logged"} icon={IndianRupee} href="/admin/marketing" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {showHealing && <Stat label="Sessions today" value={String(k.todaySessions)} icon={CalendarDays} href="/admin/bookings" />}
        {showShop && <Stat label="Orders to ship" value={String(k.toShip)} icon={ShoppingCart} href="/admin/orders?status=open" />}
        <Stat label="New enquiries" value={String(k.newEnquiries)} icon={MessageSquare} href="/admin/enquiries" />
        <Stat label="Reviews to approve" value={String(k.pendingReviews)} icon={Star} href="/admin/reviews" />
        {showShop && <Stat label="Low stock" value={String(k.lowStock)} hint="3 or fewer left" icon={AlertTriangle} href="/admin/products?stock=low" />}
      </div>

      <Card title="Revenue per day (₹)" className="mt-6">
        <LineChart format="inrCompact" labels={rev.labels} series={[{ name: "Crystal shop", values: rev.shop }, { name: "Sessions", values: rev.healing }]} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {showHealing && (
          <Card title="Upcoming sessions" actions={<Link href="/admin/bookings" className="text-xs font-semibold text-plum-700">All bookings →</Link>} pad={false}>
            <ul className="divide-y divide-lavender-100">
              {upcoming.map((b) => (
                <li key={b.id}><Link href={`/admin/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-lavender-50">
                  <span><b className="text-plum-900">{b.name}</b><span className="block text-xs text-ink-soft">{b.serviceName} · {b.mode}</span></span>
                  <span className="text-right text-xs"><span className="block font-semibold">{fmtDateTime(b.startsAt)}</span><Badge tone={statusTone(b.status)}>{b.status}</Badge></span>
                </Link></li>
              ))}
              {!upcoming.length && <li className="px-5 py-8 text-center text-sm text-ink-soft">No upcoming sessions.</li>}
            </ul>
          </Card>
        )}
        {showShop && (
          <Card title="Latest orders" actions={<Link href="/admin/orders" className="text-xs font-semibold text-plum-700">All orders →</Link>} pad={false}>
            <ul className="divide-y divide-lavender-100">
              {recent.map((o) => (
                <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 px-5 py-3 text-sm hover:bg-lavender-50">
                  <span><b className="text-plum-900">{o.number}</b><span className="block text-xs text-ink-soft">{o.name} · {o.shippingAddress.city}</span></span>
                  <span className="text-right"><b className="block tabular-nums">{inr(o.total)}</b><Badge tone={statusTone(o.status)}>{o.status}</Badge></span>
                </Link></li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {can(user.role, "audit") && (
        <Card title="Recent changes" actions={<Link href="/admin/audit" className="text-xs font-semibold text-plum-700">Activity log →</Link>} className="mt-6" pad={false}>
          <ul className="divide-y divide-lavender-100 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
                <span><Badge tone="plum">{a.action}</Badge> <span className="ml-1">{a.summary}</span></span>
                <span className="text-xs text-ink-soft">{a.staffName} · {fmtDateTime(a.createdAt)}</span>
              </li>
            ))}
            {!activity.length && <li className="px-5 py-8 text-center text-ink-soft">No changes yet.</li>}
          </ul>
        </Card>
      )}
    </>
  );
}
