import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { SHOP_URL } from "@/lib/site";
import { Btn, PageHeader } from "@/components/admin/ui";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("products");
  const [p] = await db.select().from(products).where(eq(products.id, Number((await params).id)));
  if (!p) notFound();
  return (
    <>
      <PageHeader title={p.nameEn} subtitle={`SKU ${p.sku}`} actions={<Btn href={`${SHOP_URL}/products/${p.slug}`} variant="ghost"><ExternalLink className="size-4" />View on shop</Btn>} />
      <ProductForm p={p} />
    </>
  );
}
