import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { deleteCategory, saveCategory } from "@/app/admin/actions/products";
import { Card, PageHeader, Table, input } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Categories" };

export default async function Categories() {
  await requireStaff("products");
  const rows = await db.select({ c: categories, n: count(products.id) }).from(categories).leftJoin(products, eq(products.categoryId, categories.id)).groupBy(categories.id).orderBy(asc(categories.sort));
  return (
    <>
      <PageHeader title="Categories" subtitle="Collections shown in the shop menu and filters. Lower sort numbers appear first." />
      <Card title="Add category" className="mb-6">
        <form action={saveCategory} className="flex flex-wrap items-end gap-2">
          <input name="nameEn" required placeholder="Name (English)" className={`${input} max-w-56`} />
          <input name="nameHi" placeholder="Name (Hindi)" className={`${input} max-w-56`} />
          <input name="sort" type="number" defaultValue={rows.length} className={`${input} w-24`} aria-label="Sort" />
          <SubmitButton>Add</SubmitButton>
        </form>
      </Card>
      <Card pad={false}>
        <Table head={["Name (English)", "Name (Hindi)", "Sort", "Products", ""]}>
          {rows.map(({ c, n }) => (
            <tr key={c.id}>
              <td colSpan={3}>
                <form action={saveCategory} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="nameEn" defaultValue={c.nameEn} className={`${input} max-w-52`} aria-label="Name (English)" />
                  <input name="nameHi" defaultValue={c.nameHi ?? ""} className={`${input} max-w-52`} aria-label="Name (Hindi)" />
                  <input name="sort" type="number" defaultValue={c.sort} className={`${input} w-20`} aria-label="Sort" />
                  <input type="hidden" name="slug" value={c.slug} />
                  <SubmitButton variant="ghost">Save</SubmitButton>
                </form>
              </td>
              <td className="tabular-nums">{n}</td>
              <td>
                {n === 0 && (
                  <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><SubmitButton variant="danger">Delete</SubmitButton></form>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
