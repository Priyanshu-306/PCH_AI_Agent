import "server-only";
import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";

export const MEDIA_ROOT = path.resolve(process.cwd(), process.env.MEDIA_DIR ?? "storage/uploads");

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024;

export function mediaKind(mime: string) {
  if (IMAGE_TYPES.includes(mime)) return "image" as const;
  if (VIDEO_TYPES.includes(mime)) return "video" as const;
  return null;
}

/** Store an uploaded file under MEDIA_ROOT/yyyy/mm and return its public /media URL. */
export async function saveUpload(file: File) {
  const kind = mediaKind(file.type);
  if (!kind) throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
  if (file.size > (kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)) throw new Error(`${file.name} is too large`);
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ext = (path.extname(file.name) || (kind === "image" ? ".jpg" : ".mp4")).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = path.basename(file.name, path.extname(file.name)).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const filename = `${dir}/${base || "file"}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  await fs.mkdir(path.join(MEDIA_ROOT, dir), { recursive: true });
  await fs.writeFile(path.join(MEDIA_ROOT, filename), Buffer.from(await file.arrayBuffer()));
  return { filename, url: `/media/${filename}`, kind, mime: file.type, size: file.size };
}

export async function deleteUpload(filename: string) {
  const full = path.join(MEDIA_ROOT, filename);
  if (!full.startsWith(MEDIA_ROOT)) return;
  await fs.rm(full, { force: true });
}
