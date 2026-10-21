"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { uploadFiles } from "./MediaPicker";

export default function MediaUploader() {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const go = async (files: FileList) => {
    setBusy(true);
    const r = await uploadFiles(files);
    setMsg([`${r.saved.length} uploaded`, ...r.errors]);
    setBusy(false);
    router.refresh();
  };
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) go(e.dataTransfer.files); }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 text-sm font-semibold text-plum-700 transition ${drag ? "border-plum-600 bg-lavender-100" : "border-lavender-300 bg-white hover:bg-lavender-50"}`}
      >
        {busy ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
        Drag photos & videos here, or click to choose
        <span className="text-xs font-normal text-ink-soft">JPG, PNG, WebP, AVIF up to 15 MB · MP4, WebM, MOV up to 300 MB</span>
      </button>
      <input ref={ref} type="file" multiple hidden accept="image/*,video/*" onChange={(e) => e.target.files && go(e.target.files)} />
      {msg.map((m) => <p key={m} className="mt-2 text-sm text-ink-soft">{m}</p>)}
    </div>
  );
}
