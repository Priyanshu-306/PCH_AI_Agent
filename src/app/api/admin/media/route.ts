import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";
import { getStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { saveUpload } from "@/lib/media";
import { audit } from "@/lib/audit";

// Staff with product, content, trainer or service access can pick and upload media.
async function staffWithMedia() {
  const user = await getStaff();
  if (!user || !["media", "products", "content", "trainers", "services", "testimonials"].some((p) => can(user.role, p as never))) return null;
  return user;
}

export async function GET(request: Request) {
  if (!(await staffWithMedia())) return new Response("Unauthorized", { status: 401 });
  const kind = new URL(request.url).searchParams.get("kind");
  const rows = await db
    .select()
    .from(media)
    .where(kind === "image" || kind === "video" ? eq(media.kind, kind) : undefined)
    .orderBy(desc(media.createdAt))
    .limit(300);
  return Response.json(rows.map((m) => ({ id: m.id, url: `/media/${m.filename}`, name: m.originalName, kind: m.kind, size: m.size })));
}

export async function POST(request: Request) {
  const user = await staffWithMedia();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const saved: { url: string; name: string; kind: string }[] = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      const s = await saveUpload(file);
      await db.insert(media).values({ filename: s.filename, originalName: file.name, mime: s.mime, size: s.size, kind: s.kind, uploadedBy: user.id });
      saved.push({ url: s.url, name: file.name, kind: s.kind });
    } catch (e) {
      errors.push(`${file.name}: ${(e as Error).message}`);
    }
  }
  if (saved.length) await audit(user, { action: "create", entity: "media", summary: `Uploaded ${saved.length} file(s): ${saved.map((s) => s.name).join(", ").slice(0, 200)}` });
  return Response.json({ saved, errors });
}
