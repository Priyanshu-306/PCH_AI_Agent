import { desc, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { marketingSpend } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { marketingSummary, rangeDays } from "@/lib/stats";
import { fmtDate, inr, istDay } from "@/lib/format";
import { addSpend, deleteSpend } from "@/app/admin/actions/system";
import { Btn, Card, Field, PageHeader, Stat, Table, input } from "@/components/admin/ui";
import { BarList } from "@/components/admin/charts";
import RangeTabs from "@/components/admin/RangeTabs";
import ImportForm from "@/components/admin/ImportForm";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Marketing spend" };

const BRAND = { healing: "Pure Conscious Healing", shop: "Pure Crystal Hub", both: "Both brands" } as const;

export default async function Marketing({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireStaff("marketing");
  const days = rangeDays((await searchParams).days);
  const [m, entries] = await Promise.all([
    marketingSummary(days),
    db.select().from(marketingSpend).where(gt(marketingSpend.day, sql`current_date - ${days}::int`)).orderBy(desc(marketingSpend.day)).limit(200),
  ]);
  const totalSpend = m.spend.shop + m.spend.healing + m.spend.both;
  const totalRevenue = m.revenue.shop + m.revenue.healing;
  const roas = (rev: number, spend: number) => (spend ? `${(rev / spend).toFixed(1)}×` : "—");
  const channels = Object.entries(m.byChannel.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.channel]: (acc[r.channel] ?? 0) + r.spend }), {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Marketing spend" subtitle="Log ad and promotion costs to see return on spend (ROAS) for each brand." actions={<Btn href="/PCH_Import_Template.xlsx" variant="ghost">Excel template</Btn>} />
      <RangeTabs days={days} base="/admin/marketing" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total spend" value={inr(totalSpend)} />
        <Stat label="Total revenue" value={inr(totalRevenue)} hint={`Overall ROAS ${roas(totalRevenue, totalSpend)}`} />
        <Stat label="Crystal Hub ROAS" value={roas(m.revenue.shop, m.spend.shop)} hint={`${inr(m.revenue.shop)} on ${inr(m.spend.shop)}`} />
        <Stat label="Healing ROAS" value={roas(m.revenue.healing, m.spend.healing)} hint={`${inr(m.revenue.healing)} on ${inr(m.spend.healing)}`} />
      </div>
      <p className="mt-2 text-xs text-ink-soft">ROAS = revenue ÷ spend for the brand. Spend logged as “Both brands” counts only in the overall figure.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card title="Spend by channel (₹)">
          <BarList format="inr" items={channels.map(([label, value]) => ({ label, value }))} empty="No spend logged in this period" />
        </Card>
        <Card title="Log spend">
          <form action={addSpend} className="grid gap-3 sm:grid-cols-2">
            <Field label="Date"><input name="day" type="date" required defaultValue={istDay()} className={input} /></Field>
            <Field label="Brand"><select name="brand" className={input}>{Object.entries(BRAND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Channel"><input name="channel" required list="channels" placeholder="Meta Ads" className={input} /></Field>
            <Field label="Amount (₹)"><input name="amount" type="number" step="0.01" min={0} required className={input} /></Field>
            <Field label="Campaign" className="sm:col-span-2"><input name="campaign" className={input} /></Field>
            <Field label="Notes" className="sm:col-span-2"><input name="notes" className={input} /></Field>
            <datalist id="channels">{["Meta Ads", "Google Ads", "Instagram influencer", "YouTube", "Event / stall", "Print", "WhatsApp broadcast", "Other"].map((c) => <option key={c} value={c} />)}</datalist>
            <div className="sm:col-span-2"><SubmitButton>Add entry</SubmitButton></div>
          </form>
          <div className="mt-6 border-t border-lavender-100 pt-5">
            <p className="mb-3 text-sm font-semibold">Or import from Excel (Marketing Spend tab)</p>
            <ImportForm kind="marketing" />
          </div>
        </Card>
      </div>

      <Card title="Entries" className="mt-6" pad={false}>
        <Table head={["Date", "Brand", "Channel", "Campaign", "Amount", ""]} empty="No entries in this period.">
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{fmtDate(e.day)}</td>
              <td>{BRAND[e.brand as keyof typeof BRAND] ?? e.brand}</td>
              <td>{e.channel}</td>
              <td className="text-ink-soft">{e.campaign}</td>
              <td className="tabular-nums">{inr(e.amount)}</td>
              <td><form action={deleteSpend}><input type="hidden" name="id" value={e.id} /><SubmitButton variant="danger" className="!min-h-8 !py-1 text-xs">Remove</SubmitButton></form></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
