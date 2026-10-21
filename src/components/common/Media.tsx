/** Uploaded image or video, chosen by file extension / URL. */
export function isVideo(src: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(src);
}

export function youtubeId(src: string) {
  return src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1] ?? null;
}

export default function Media({ src, alt = "", className = "" }: { src: string; alt?: string; className?: string }) {
  const yt = youtubeId(src);
  if (yt)
    return (
      <iframe
        className={className}
        src={`https://www.youtube-nocookie.com/embed/${yt}`}
        title={alt || "Video"}
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  if (isVideo(src)) return <video className={className} src={src} muted loop playsInline autoPlay preload="metadata" aria-label={alt} />;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" />;
}
