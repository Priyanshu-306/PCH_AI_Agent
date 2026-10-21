import Link from "next/link";
import { and, asc, desc, eq, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { Download, FileSpreadsheet, Plus } from "lucide-react";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { inr, unitPriceOf } from "@/lib/format";
import { quickStock } from "@/app/admin/actions/products";
import CrystalArt from "@/components/common/CrystalArt";
import { Badge, Btn, Card, Filters, PageHeader, Pager, Table, input, statusTone } from "@/components/admin/ui";

export const metadata = { title: "Products" };
const PER = 30;

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("products");
  const sp = await searchParams;
  const where: SQL[] = [];
  if (sp.q) where.push(or(ilike(products.nameEn, `%${sp.q}%`), ilike(products.sku, `%${sp.q}%`), ilike(products.crystals, `%${sp.q}%`))!);
  if (sp.status) where.push(eq(products.status, sp.status as "active"));
  if (sp.category) where.push(eq(products.categoryId, Number(sp.category)));
  if (sp.stock === "low") where.push(lte(products.stockQty, 3));
  const page = Math.max(1, Number(sp.page ?? 1));
  const [rows, [{ n }], cats] = await Promise.all([
    db.select({ p: products, category: categories.nameEn }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(and(...where)).orderBy(sp.stock === "low" ? asc(products.stockQty) : desc(products.updatedAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(products).where(and(...where)),
    db.select().from(categories).orderBy(asc(categories.sort)),
  ]);
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${n} product${n === 1 ? "" : "s"} in Pure Crystal Hub`}
        actions={<>
          <Btn href="/api/admin/products/export" variant="ghost"><Download className="size-4" />Export Excel</Btn>
          <Btn href="/admin/products/import" variant="ghost"><FileSpreadsheet className="size-4" />Import Excel</Btn>
          <Btn href="/admin/products/new"><Plus className="size-4" />Add product</Btn>
        </>}
      />
      <Filters>
        <input name="q" defaultValue={sp.q} placeholder="Search name, SKU, crystal…" className={`${input} max-w-xs`} />
        <select name="category" defaultValue={sp.category ?? ""} className={`${input} w-auto`}><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className={`${input} w-auto`}><option value="">Any status</option><option value="active">Active</option><option value="draft">Draft</option><option value="out_of_stock">Out of stock</option></select>
        <select name="stock" defaultValue={sp.stock ?? ""} className={`${input} w-auto`}><option value="">Any stock</option><option value="low">Low stock (≤3)</option></select>
        <Btn variant="ghost">Apply</Btn>
      </Filters>
      <Card pad={false}>
        <Table head={["Product", "SKU", "Category", "Price", "Stock", "Status", ""]} empty="No products match.">
          {rows.map(({ p, category }) => (
            <tr key={p.id} className="hover:bg-lavender-50/50">
              <td>
                <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                  <span className="size-11 shrink-0 overflow-hidden rounded-lg border border-lavender-100">
                    {p.images[0] ? <img src={p.images[0]} alt="" className="size-full object-cover" /> : <CrystalArt crystals={p.crystals} category={category} className="size-full" />}
                  </span>
                  <span className="font-semibold text-plum-900">{p.nameEn}{p.isFeatured && <span className="ml-2 text-xs text-gold-600">★ featured</span>}</span>
                </Link>
              </td>
              <td className="font-mono text-xs">{p.sku}</td>
              <td>{category ?? "—"}</td>
              <td className="tabular-nums">{inr(unitPriceOf(p))}{p.salePrice ? <span className="ml-1 text-xs text-mist line-through">{inr(p.mrp)}</span> : null}</td>
              <td>
                <form action={quickStock} className="flex items-center gap-1">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="stockQty" type="number" min={0} defaultValue={p.stockQty} aria-label={`Stock for ${p.nameEn}`} className={`w-16 rounded-lg border px-2 py-1 text-sm ${p.stockQty <= 3 ? "border-amber-300 bg-amber-50" : "border-lavender-200"}`} />
                  <button className="rounded-lg px-2 py-1 text-xs font-semibold text-plum-700 hover:bg-lavender-100">Save</button>
                </form>
              </td>
              <td><Badge tone={statusTone(p.status)}>{p.status.replace("_", " ")}</Badge></td>
              <td><Link href={`/admin/products/${p.id}`} className="text-xs font-semibold text-plum-700">Edit</Link></td>
            </tr>
          ))}
        </Table>
        <Pager page={page} pages={Math.ceil(n / PER)} base={`/admin/products${qs ? `?${qs}` : ""}`} />
      </Card>
    </>
  );
}
