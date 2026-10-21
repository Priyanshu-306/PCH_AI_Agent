import { desc, eq } from "drizzle-orm";
import { Film } from "lucide-react";
import { db } from "@/db";
import { media } from "@/db/schema";
import { requireStaff } from "@/lib/auth";
import { deleteMedia } from "@/app/admin/actions/system";
import { Card, PageHeader } from "@/components/admin/ui";
import MediaUploader from "@/components/admin/MediaUploader";
import CopyButton from "@/components/admin/CopyButton";
import SubmitButton from "@/components/admin/SubmitButton";

export const metadata = { title: "Media library" };

const size = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);

export default async function MediaLibrary({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  await requireStaff("media");
  const kind = (await searchParams).kind;
  const rows = await db.select().from(media).where(kind === "image" || kind === "video" ? eq(media.kind, kind) : undefined).orderBy(desc(media.createdAt));
  return (
    <>
      <PageHeader title="Media library" subtitle="All photos and videos for both websites. Use file names in the Excel import, or pick them in any editor." />
      <MediaUploader />
      <div className="mt-6 mb-3 flex gap-2 text-sm">
        {[["", "All"], ["image", "Images"], ["video", "Videos"]].map(([k, l]) => (
          <a key={k} href={k ? `?kind=${k}` : "?"} className={`rounded-full px-4 py-1.5 font-semibold ${(kind ?? "") === k ? "bg-plum-700 text-white" : "bg-white text-plum-800 ring-1 ring-lavender-200"}`}>{l}</a>
        ))}
      </div>
      {rows.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((m) => (
            <Card key={m.id} pad={false} className="overflow-hidden">
              <div className="aspect-square bg-lavender-50">
                {m.kind === "video" ? <video src={`/media/${m.filename}`} muted preload="metadata" className="size-full object-cover" /> : <img src={`/media/${m.filename}`} alt={m.alt ?? m.originalName} loading="lazy" className="size-full object-cover" />}
              </div>
              <div className="space-y-1 p-3 text-xs">
                <p className="flex items-center gap-1 truncate font-semibold" title={m.originalName}>{m.kind === "video" && <Film className="size-3.5 shrink-0" />}{m.originalName}</p>
                <p className="text-ink-soft">{size(m.size)}</p>
                <div className="flex items-center justify-between pt-1">
                  <CopyButton text={`/media/${m.filename}`} />
                  <form action={deleteMedia}><input type="hidden" name="id" value={m.id} /><SubmitButton variant="danger" className="!min-h-7 !px-2 !py-1 text-xs">Delete</SubmitButton></form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><p className="py-8 text-center text-sm text-ink-soft">No files yet. Upload the healing-space videos, founder portrait and product photos above.</p></Card>
      )}
    </>
  );
}
