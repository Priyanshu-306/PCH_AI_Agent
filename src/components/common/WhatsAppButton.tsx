import { MessageCircle } from "lucide-react";

export default function WhatsAppButton({ number, text = "Namaste! I'd like to know more." }: { number: string; text?: string }) {
  const n = number.replace(/\D/g, "");
  if (!n) return null;
  return (
    <a
      href={`https://wa.me/${n}?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-8px_rgb(37_211_102/0.7)] transition hover:scale-105"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
