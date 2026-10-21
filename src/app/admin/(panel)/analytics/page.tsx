import { requireStaff } from "@/lib/auth";
import { bestSellers, bookingsByService, devices, funnel, kpis, rangeDays, revenueSeries, sources, topPages, visitorSeries } from "@/lib/stats";
import { inr } from "@/lib/format";
import { Card, PageHeader, Stat } from "@/components/admin/ui";
import { BarList, LineChart } from "@/components/admin/charts";
import { SERIES } from "@/components/admin/chart-colors";
import RangeTabs from "@/components/admin/RangeTabs";

export const metadata = { title: "Analytics" };

const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");

export default async function Analytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireStaff("analytics");
  const days = rangeDays((await searchParams).days);
  const [k, rev, vis, pages, src, dev, f, sellers, svc] = await Promise.all([kpis(days), revenueSeries(days), visitorSeries(days), topPages(days), sources(days), devices(days), funnel(days), bestSellers(days), bookingsByService(days)]);
  const totalRevenue = k.shopRevenue + k.healingRevenue;
  return (
    <>
      <PageHeader title="Analytics" subtitle="Privacy-friendly first-party analytics for both websites — no third-party trackers." />
      <RangeTabs days={days} base="/admin/analytics" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Revenue" value={inr(totalRevenue)} hint={`${inr(k.shopRevenue)} shop · ${inr(k.healingRevenue)} sessions`} />
        <Stat label="Visitors" value={k.visitors.toLocaleString("en-IN")} hint={`${k.pageViews.toLocaleString("en-IN")} page views`} />
        <Stat label="Shop conversion" value={pct(f.orders, f.visitors)} hint={`${f.orders} orders / ${f.visitors} visitors`} />
        <Stat label="Booking conversion" value={pct(f.h_bookings, f.h_visitors)} hint={`${f.h_bookings} bookings / ${f.h_visitors} visitors`} />
        <Stat label="Avg. order value" value={k.orders ? inr(k.shopRevenue / k.orders) : "—"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Revenue per day (₹)">
          <LineChart format="inrCompact" labels={rev.labels} series={[{ name: "Crystal shop", values: rev.shop }, { name: "Sessions", values: rev.healing }]} />
        </Card>
        <Card title="Unique visitors per day">
          <LineChart labels={vis.labels} series={[{ name: "Healing site", values: vis.healing }, { name: "Crystal shop", values: vis.shop }]} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Shop funnel (unique visitors)">
          <BarList format="number" items={[
            { label: "Visited shop", value: f.visitors },
            { label: "Added to cart", value: f.carts, hint: pct(f.carts, f.visitors) },
            { label: "Started checkout", value: f.checkouts, hint: pct(f.checkouts, f.visitors) },
            { label: "Ordered", value: f.orders, hint: pct(f.orders, f.visitors) },
          ]} />
        </Card>
        <Card title="Traffic sources">
          <BarList format="number" items={src.map((s) => ({ label: s.source, value: Number(s.visitors) }))} color={SERIES[1]} />
        </Card>
        <Card title="Devices">
          <BarList format="number" items={dev.map((d) => ({ label: d.device, value: Number(d.visitors) }))} color={SERIES[2]} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Best-selling crystals (₹)">
          <BarList format="inr" items={sellers.map((s) => ({ label: s.name, value: Number(s.revenue), hint: `${s.qty} sold` }))} />
        </Card>
        <Card title="Sessions by service (₹)">
          <BarList format="inr" items={svc.map((s) => ({ label: s.name, value: Number(s.revenue), hint: `${s.n} booked` }))} color={SERIES[1]} />
        </Card>
        <Card title="Top pages">
          <BarList format="number" items={pages.map((p) => ({ label: `${p.site === "shop" ? "Shop" : "Healing"} ${p.path}`, value: Number(p.views) }))} color={SERIES[2]} />
        </Card>
      </div>
    </>
  );
}
