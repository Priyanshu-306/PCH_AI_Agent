import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Add product" };

export default async function NewProduct() {
  await requireStaff("products");
  return (
    <>
      <PageHeader title="Add product" subtitle="Add a single crystal with photos and video. For many products at once, use Import Excel." />
      <ProductForm />
    </>
  );
}
