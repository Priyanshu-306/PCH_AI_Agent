import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories, type products } from "@/db/schema";
import { saveProduct, deleteProduct } from "@/app/admin/actions/products";
import { CHAKRAS } from "@/lib/crystal-colors";
import { Card, Field, input } from "./ui";
import { GalleryField, MediaField } from "./MediaPicker";
import SubmitButton from "./SubmitButton";

type P = typeof products.$inferSelect;

export default async function ProductForm({ p }: { p?: P }) {
  const cats = await db.select().from(categories).orderBy(asc(categories.sort));
  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <form id="product-form" action={saveProduct} className="contents">
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="space-y-6">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (English) *"><input name="nameEn" required defaultValue={p?.nameEn} className={input} /></Field>
              <Field label="Name (Hindi)"><input name="nameHi" defaultValue={p?.nameHi ?? ""} className={input} /></Field>
              <Field label="SKU *" hint="Unique code, used by Excel import to update"><input name="sku" required defaultValue={p?.sku} className={input} /></Field>
              <Field label="Category">
                <select name="categoryId" defaultValue={p?.categoryId ?? ""} className={input}>
                  <option value="">—</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
                </select>
              </Field>
              <Field label="Crystal(s)" hint="Comma separated — also sets the 3D/illustration colour" className="sm:col-span-2"><input name="crystals" defaultValue={p?.crystals} className={input} /></Field>
              <Field label="Description (English)" className="sm:col-span-2"><textarea name="descriptionEn" rows={5} defaultValue={p?.descriptionEn} className={input} /></Field>
              <Field label="Description (Hindi)" className="sm:col-span-2"><textarea name="descriptionHi" rows={4} defaultValue={p?.descriptionHi ?? ""} className={input} /></Field>
            </div>
          </Card>
          <Card title="Photos & video">
            <Field label="Gallery" hint="First image is the cover. Upload JPG/PNG/WebP up to 15 MB."><GalleryField name="images" defaultValue={p?.images ?? []} /></Field>
            <div className="mt-5"><Field label="Product video (optional)" hint="Upload MP4/WebM or paste a YouTube link"><MediaField name="video" kind="video" defaultValue={p?.video ?? ""} /></Field></div>
          </Card>
          <Card title="Healing attributes">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Healing properties" hint="Comma separated, e.g. Calm, Sleep, Intuition" className="sm:col-span-2"><input name="healingProperties" defaultValue={p?.healingProperties} className={input} /></Field>
              <Field label="Chakras" hint={CHAKRAS.map((c) => c.key).join(", ")}><input name="chakras" defaultValue={p?.chakras} className={input} /></Field>
              <Field label="Zodiac"><input name="zodiac" defaultValue={p?.zodiac} className={input} /></Field>
              <Field label="Size"><input name="size" defaultValue={p?.size ?? ""} className={input} /></Field>
              <Field label="Weight (grams)"><input name="weightGrams" type="number" min={0} defaultValue={p?.weightGrams ?? ""} className={input} /></Field>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Price & stock">
            <div className="grid grid-cols-2 gap-4">
              <Field label="MRP (₹) *"><input name="mrp" type="number" step="0.01" min={0} required defaultValue={p ? Number(p.mrp) : ""} className={input} /></Field>
              <Field label="Sale price (₹)"><input name="salePrice" type="number" step="0.01" min={0} defaultValue={p?.salePrice != null ? Number(p.salePrice) : ""} className={input} /></Field>
              <Field label="GST %"><input name="gstPercent" type="number" step="0.01" min={0} max={28} defaultValue={p ? Number(p.gstPercent) : 3} className={input} /></Field>
              <Field label="HSN code"><input name="hsnCode" defaultValue={p?.hsnCode ?? ""} className={input} /></Field>
              <Field label="Stock quantity"><input name="stockQty" type="number" min={0} defaultValue={p?.stockQty ?? 0} className={input} /></Field>
              <Field label="Status">
                <select name="status" defaultValue={p?.status ?? "active"} className={input}>
                  <option value="active">Active (visible)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={p?.isFeatured} className="size-4 accent-[#5b3e8c]" /> Featured (home pages & healing-site showcase)</label>
          </Card>
          <Card title="SEO">
            <Field label="URL slug" hint="Leave blank to generate from the name"><input name="slug" defaultValue={p?.slug} className={input} /></Field>
          </Card>
          <div className="flex flex-wrap gap-2">
            <SubmitButton>{p ? "Save changes" : "Add product"}</SubmitButton>
          </div>
        </div>
      </form>
      {p && (
        <form action={deleteProduct} className="lg:col-start-2">
          <input type="hidden" name="id" value={p.id} />
          <SubmitButton variant="danger">Delete product</SubmitButton>
        </form>
      )}
    </div>
  );
}
