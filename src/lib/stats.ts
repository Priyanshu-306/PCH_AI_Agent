import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// "Counted" orders: not cancelled, and either paid or a COD/WhatsApp order (paid on delivery).
const COUNTED_ORDER = sql.raw(`status <> 'cancelled' and (payment_status = 'paid' or payment_method <> 'razorpay')`);
const COUNTED_BOOKING = sql.raw(`status in ('confirmed','completed') `);
const IST_DAY = (col: string) => sql.raw(`(${col} at time zone 'Asia/Kolkata')::date`);

type Row = Record<string, unknown>;
const rows = async <T extends Row>(q: ReturnType<typeof sql>) => (await db.execute(q)).rows as T[];

export function rangeDays(param?: string) {
  const n = Number(param);
  return [7, 30, 90, 365].includes(n) ? n : 30;
}

/** Daily shop + session revenue for the last `days` days (IST), zero-filled. */
export async function revenueSeries(days: number) {
  const r = await rows<{ day: string; shop: string; healing: string }>(sql`
    with d as (select generate_series((now() at time zone 'Asia/Kolkata')::date - ${days - 1}::int, (now() at time zone 'Asia/Kolkata')::date, '1 day')::date as day)
    select to_char(d.day, 'DD Mon') as day,
      coalesce((select sum(total) from orders where ${IST_DAY("created_at")} = d.day and ${COUNTED_ORDER}), 0) as shop,
      coalesce((select sum(price) from bookings where ${IST_DAY("created_at")} = d.day and ${COUNTED_BOOKING}), 0) as healing
    from d order by d.day`);
  return { labels: r.map((x) => x.day), shop: r.map((x) => Number(x.shop)), healing: r.map((x) => Number(x.healing)) };
}

export async function visitorSeries(days: number) {
  const r = await rows<{ day: string; healing: string; shop: string }>(sql`
    with d as (select generate_series((now() at time zone 'Asia/Kolkata')::date - ${days - 1}::int, (now() at time zone 'Asia/Kolkata')::date, '1 day')::date as day)
    select to_char(d.day, 'DD Mon') as day,
      (select count(distinct visitor_id) from analytics_events where type = 'page_view' and site = 'healing' and ${IST_DAY("created_at")} = d.day) as healing,
      (select count(distinct visitor_id) from analytics_events where type = 'page_view' and site = 'shop' and ${IST_DAY("created_at")} = d.day) as shop
    from d order by d.day`);
  return { labels: r.map((x) => x.day), healing: r.map((x) => Number(x.healing)), shop: r.map((x) => Number(x.shop)) };
}

export async function kpis(days: number) {
  const [k] = await rows<Row>(sql`
    select
      (select coalesce(sum(total),0) from orders where created_at > now() - make_interval(days => ${days}) and ${COUNTED_ORDER}) as shop_revenue,
      (select count(*) from orders where created_at > now() - make_interval(days => ${days}) and ${COUNTED_ORDER}) as orders,
      (select coalesce(sum(price),0) from bookings where created_at > now() - make_interval(days => ${days}) and ${COUNTED_BOOKING}) as healing_revenue,
      (select count(*) from bookings where created_at > now() - make_interval(days => ${days}) and ${COUNTED_BOOKING}) as bookings,
      (select count(distinct visitor_id) from analytics_events where type='page_view' and created_at > now() - make_interval(days => ${days})) as visitors,
      (select count(*) from analytics_events where type='page_view' and created_at > now() - make_interval(days => ${days})) as page_views,
      (select coalesce(sum(amount),0) from marketing_spend where day > current_date - ${days}::int) as spend,
      (select count(*) from bookings where status = 'confirmed' and (starts_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date) as today_sessions,
      (select count(*) from orders where status in ('new','confirmed','packed')) as to_ship,
      (select count(*) from enquiries where status = 'new') as new_enquiries,
      (select count(*) from reviews where status = 'pending') as pending_reviews,
      (select count(*) from products where status = 'active' and stock_qty <= 3) as low_stock`);
  const n = (key: string) => Number(k[key] ?? 0);
  return {
    shopRevenue: n("shop_revenue"), orders: n("orders"), healingRevenue: n("healing_revenue"), bookings: n("bookings"),
    visitors: n("visitors"), pageViews: n("page_views"), spend: n("spend"), todaySessions: n("today_sessions"),
    toShip: n("to_ship"), newEnquiries: n("new_enquiries"), pendingReviews: n("pending_reviews"), lowStock: n("low_stock"),
  };
}

export async function topPages(days: number, limit = 8) {
  return rows<{ site: string; path: string; views: string }>(sql`
    select site, path, count(*) as views from analytics_events
    where type = 'page_view' and created_at > now() - make_interval(days => ${days})
    group by site, path order by views desc limit ${limit}`);
}

export async function sources(days: number) {
  return rows<{ source: string; visitors: string }>(sql`
    select coalesce(utm_source, case when referrer is null then 'Direct' else regexp_replace(referrer, '^https?://(www\\.)?([^/]+).*$', '\\2') end) as source,
      count(distinct visitor_id) as visitors
    from analytics_events where type = 'page_view' and created_at > now() - make_interval(days => ${days})
    group by 1 order by 2 desc limit 8`);
}

export async function devices(days: number) {
  return rows<{ device: string; visitors: string }>(sql`
    select coalesce(device, 'unknown') as device, count(distinct visitor_id) as visitors
    from analytics_events where type = 'page_view' and created_at > now() - make_interval(days => ${days})
    group by 1 order by 2 desc`);
}

export async function funnel(days: number) {
  const [f] = await rows<Row>(sql`
    select
      (select count(distinct visitor_id) from analytics_events where site='shop' and type='page_view' and created_at > now() - make_interval(days => ${days})) as visitors,
      (select count(distinct visitor_id) from analytics_events where site='shop' and type='add_to_cart' and created_at > now() - make_interval(days => ${days})) as carts,
      (select count(distinct visitor_id) from analytics_events where site='shop' and type='checkout_start' and created_at > now() - make_interval(days => ${days})) as checkouts,
      (select count(*) from orders where created_at > now() - make_interval(days => ${days}) and ${COUNTED_ORDER}) as orders,
      (select count(distinct visitor_id) from analytics_events where site='healing' and type='page_view' and created_at > now() - make_interval(days => ${days})) as h_visitors,
      (select count(distinct visitor_id) from analytics_events where site='healing' and type='booking_start' and created_at > now() - make_interval(days => ${days})) as h_starts,
      (select count(*) from bookings where created_at > now() - make_interval(days => ${days}) and ${COUNTED_BOOKING}) as h_bookings`);
  return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Number(v)])) as Record<string, number>;
}

export async function bestSellers(days: number, limit = 8) {
  return rows<{ name: string; qty: string; revenue: string }>(sql`
    select oi.name, sum(oi.qty) as qty, sum(oi.qty * oi.unit_price) as revenue
    from order_items oi join orders o on o.id = oi.order_id
    where o.created_at > now() - make_interval(days => ${days}) and ${sql.raw(`o.status <> 'cancelled' and (o.payment_status = 'paid' or o.payment_method <> 'razorpay')`)}
    group by oi.name order by revenue desc limit ${limit}`);
}

export async function bookingsByService(days: number) {
  return rows<{ name: string; n: string; revenue: string }>(sql`
    select service_name as name, count(*) as n, coalesce(sum(price),0) as revenue from bookings
    where created_at > now() - make_interval(days => ${days}) and ${COUNTED_BOOKING}
    group by 1 order by revenue desc`);
}

export async function marketingSummary(days: number) {
  const byChannel = await rows<{ brand: string; channel: string; spend: string }>(sql`
    select brand, channel, sum(amount) as spend from marketing_spend where day > current_date - ${days}::int group by 1, 2 order by 3 desc`);
  const [rev] = await rows<{ shop: string; healing: string }>(sql`
    select
      (select coalesce(sum(total),0) from orders where created_at > now() - make_interval(days => ${days}) and ${COUNTED_ORDER}) as shop,
      (select coalesce(sum(price),0) from bookings where created_at > now() - make_interval(days => ${days}) and ${COUNTED_BOOKING}) as healing`);
  const spend = { shop: 0, healing: 0, both: 0 };
  for (const r of byChannel) spend[r.brand as keyof typeof spend] = (spend[r.brand as keyof typeof spend] ?? 0) + Number(r.spend);
  return { byChannel: byChannel.map((r) => ({ ...r, spend: Number(r.spend) })), spend, revenue: { shop: Number(rev.shop), healing: Number(rev.healing) } };
}
