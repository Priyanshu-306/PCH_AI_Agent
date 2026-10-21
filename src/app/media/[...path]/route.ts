import path from "node:path";
import fs from "node:fs";
import { MEDIA_ROOT } from "@/lib/media";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
};

// Streams uploaded media with HTTP Range support so videos can be scrubbed on scroll.
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  const full = path.join(MEDIA_ROOT, rel);
  if (!full.startsWith(MEDIA_ROOT + path.sep) || !fs.existsSync(full)) return new Response("Not found", { status: 404 });

  const { size } = fs.statSync(full);
  const type = TYPES[path.extname(full).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (type === "image/svg+xml") headers["Content-Security-Policy"] = "script-src 'none'";

  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = fs.createReadStream(full, { start, end });
    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(fs.createReadStream(full) as unknown as ReadableStream, { headers: { ...headers, "Content-Length": String(size) } });
}
