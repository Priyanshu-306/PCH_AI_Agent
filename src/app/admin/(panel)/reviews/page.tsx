import { desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { moderateReview } from "@/app/admin/actions/shop";
import { Badge, Card, PageHeader, statusTone } from "@/components/admin/ui";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Reviews" };

export default async function Reviews({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff("reviews");
  const status = ((await searchParams).status ?? "pending") as "pending" | "approved" | "rejected";
  const rows = await db.select({ r: reviews, product: products.nameEn }).from(reviews).innerJoin(products, eq(products.id, reviews.productId)).where(eq(reviews.status, status)).orderBy(desc(reviews.createdAt));
  return (
    <>
      <PageHeader title="Product reviews" subtitle="Reviews appear on the shop only after approval." />
      <div className="mb-4 flex gap-2 text-sm">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <a key={s} href={`?status=${s}`} className={`rounded-full px-4 py-1.5 font-semibold capitalize ${s === status ? "bg-plum-700 text-white" : "bg-white text-plum-800 ring-1 ring-lavender-200"}`}>{s}</a>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map(({ r, product }) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="flex items-center gap-1">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-gold-500 text-gold-500" : "text-lavender-200"}`} />)}<span className="ml-2 text-xs text-ink-soft">{product}</span></p>
                {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                <p className="mt-1 text-sm">{r.body}</p>
                <p className="mt-2 text-xs text-ink-soft">{r.name} · {fmtDateTime(r.createdAt)} <Badge tone={statusTone(r.status)}>{r.status}</Badge></p>
              </div>
              <form action={moderateReview} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={r.id} />
                {r.status !== "approved" && <SubmitButton name="status" value="approved">Approve</SubmitButton>}
                {r.status !== "rejected" && <SubmitButton name="status" value="rejected" variant="ghost">Reject</SubmitButton>}
                <SubmitButton name="status" value="delete" variant="danger">Delete</SubmitButton>
              </form>
            </div>
          </Card>
        ))}
        {!rows.length && <Card><p className="py-6 text-center text-sm text-ink-soft">No {status} reviews.</p></Card>}
      </div>
    </>
  );
}
