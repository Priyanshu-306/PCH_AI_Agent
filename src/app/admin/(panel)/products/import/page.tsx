import { requireStaff } from "@/lib/auth";
import { Btn, Card, PageHeader } from "@/components/admin/ui";
import ImportForm from "@/components/admin/ImportForm";

export const metadata = { title: "Import products" };

export default async function ImportProducts() {
  await requireStaff("products");
  return (
    <>
      <PageHeader title="Import products from Excel" subtitle="Rows are matched by SKU: existing products are updated, new SKUs are created." actions={<Btn href="/PCH_Import_Template.xlsx" variant="ghost">Download template</Btn>} />
      <Card>
        <ol className="mb-6 list-decimal space-y-1.5 pl-5 text-sm text-ink-soft">
          <li>Upload product photos and videos in <a href="/admin/media" className="font-semibold text-plum-700 underline">Media library</a> first.</li>
          <li>Fill the <b>Products</b> tab of the template. Put photo file names (e.g. <code>amethyst-1.jpg</code>) in <code>image_files</code>, comma separated.</li>
          <li>Upload the .xlsx file below. A report shows any rows that need fixing; every import is recorded in the activity log.</li>
        </ol>
        <ImportForm kind="products" />
      </Card>
    </>
  );
}
