"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Film, ImagePlus, Loader2, Upload, X } from "lucide-react";

type Item = { id: number; url: string; name: string; kind: string };

export async function uploadFiles(files: FileList | File[]) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append("files", f));
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  return (await res.json()) as { saved: { url: string; name: string; kind: string }[]; errors: string[] };
}

/** Modal to choose existing media or upload new files. */
export function MediaModal({ kind, multiple, onPick, onClose }: { kind?: "image" | "video"; multiple?: boolean; onPick: (urls: string[]) => void; onClose: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const file = useRef<HTMLInputElement>(null);
  const load = useCallback(() => fetch(`/api/admin/media${kind ? `?kind=${kind}` : ""}`).then((r) => r.json()).then(setItems), [kind]);
  useEffect(() => {
    load();
  }, [load]);

  const upload = async (files: FileList) => {
    setBusy(true);
    const r = await uploadFiles(files);
    setErrors(r.errors);
    setBusy(false);
    await load();
    setSel((s) => (multiple ? [...s, ...r.saved.map((x) => x.url)] : r.saved.slice(0, 1).map((x) => x.url)));
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-lavender-100 px-5 py-3">
          <h2 className="font-bold text-plum-900">Media library</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <button type="button" onClick={() => file.current?.click()} disabled={busy} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-lavender-300 py-6 text-sm font-semibold text-plum-700 hover:bg-lavender-50">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Upload {kind ?? "images or videos"} from your computer
          </button>
          <input ref={file} type="file" hidden multiple accept={kind === "video" ? "video/*" : kind === "image" ? "image/*" : "image/*,video/*"} onChange={(e) => e.target.files && upload(e.target.files)} />
          {errors.map((e) => <p key={e} className="mb-2 text-sm text-red-600">{e}</p>)}
          {!items ? (
            <Loader2 className="mx-auto size-6 animate-spin" />
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {items.map((m) => {
                const on = sel.includes(m.url);
                return (
                  <button type="button" key={m.id} onClick={() => setSel((s) => (multiple ? (on ? s.filter((x) => x !== m.url) : [...s, m.url]) : [m.url]))} className={`relative aspect-square overflow-hidden rounded-xl border-2 ${on ? "border-plum-600" : "border-transparent"}`} title={m.name}>
                    {m.kind === "video" ? <span className="grid size-full place-items-center bg-plum-900 text-white"><Film className="size-6" /></span> : <img src={m.url} alt={m.name} className="size-full object-cover" />}
                    {on && <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-plum-700 text-[0.65rem] font-bold text-white">{sel.indexOf(m.url) + 1}</span>}
                  </button>
                );
              })}
              {!items.length && <p className="col-span-full py-6 text-center text-sm text-ink-soft">No media yet — upload your first photos and videos above.</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-lavender-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-lavender-200 px-4 py-2 text-sm font-semibold">Cancel</button>
          <button type="button" disabled={!sel.length} onClick={() => onPick(sel)} className="rounded-xl bg-plum-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Use {sel.length || ""} selected</button>
        </div>
      </div>
    </div>
  );
}

/** Form field holding one media URL (hidden input) with preview + picker. */
export function MediaField({ name, defaultValue = "", kind }: { name: string; defaultValue?: string; kind?: "image" | "video" }) {
  const [url, setUrl] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const isVideo = /\.(mp4|webm|mov)$/i.test(url);
  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name={name} value={url} />
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-lavender-200 bg-lavender-50">
        {url ? isVideo ? <Film className="size-6 text-plum-600" /> : <img src={url} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6 text-mist" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={kind === "video" ? "/media/… or YouTube link" : "/media/…"} className="w-full rounded-lg border border-lavender-200 px-2.5 py-1.5 text-xs" />
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-lavender-200 px-3 py-1.5 text-xs font-semibold text-plum-700 hover:bg-lavender-50">Choose / upload</button>
          {url && <button type="button" onClick={() => setUrl("")} className="text-xs font-semibold text-red-700">Remove</button>}
        </div>
      </div>
      {open && <MediaModal kind={kind} onClose={() => setOpen(false)} onPick={(u) => { setUrl(u[0]); setOpen(false); }} />}
    </div>
  );
}

/** Ordered gallery of image URLs serialised into one hidden JSON input. */
export function GalleryField({ name, defaultValue = [] }: { name: string; defaultValue?: string[] }) {
  const [list, setList] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const move = (i: number, d: number) => setList((l) => { const n = [...l]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(list)} />
      <div className="flex flex-wrap gap-3">
        {list.map((u, i) => (
          <div key={u + i} className="group relative size-24 overflow-hidden rounded-xl border border-lavender-200">
            <img src={u} alt="" className="size-full object-cover" />
            {i === 0 && <span className="absolute top-1 left-1 rounded bg-plum-700 px-1.5 text-[0.6rem] font-bold text-white">Cover</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 px-1 py-0.5 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left" className="px-1 disabled:opacity-30">←</button>
              <button type="button" onClick={() => setList((l) => l.filter((_, k) => k !== i))} aria-label="Remove" className="px-1">✕</button>
              <button type="button" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move right" className="px-1 disabled:opacity-30">→</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setOpen(true)} className="grid size-24 place-items-center rounded-xl border-2 border-dashed border-lavender-300 text-plum-600 hover:bg-lavender-50" aria-label="Add images">
          <ImagePlus className="size-6" />
        </button>
      </div>
      {open && <MediaModal kind="image" multiple onClose={() => setOpen(false)} onPick={(u) => { setList((l) => [...l, ...u.filter((x) => !l.includes(x))]); setOpen(false); }} />}
    </div>
  );
}
