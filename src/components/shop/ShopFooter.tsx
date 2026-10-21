import Link from "next/link";
import { Mail, MessageCircle, Phone, ShieldCheck, Truck } from "lucide-react";
import type { Settings } from "@/lib/settings";

export default function ShopFooter({ contact, about, healingUrl }: { contact: Settings["contact"]; about: string; healingUrl: string }) {
  return (
    <footer className="relative mt-24 border-t border-white/10 bg-night-950">
      <div className="container-x grid gap-10 py-14 text-crystal/75 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-carved text-2xl text-crystal">Pure Crystal Hub</div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">{about}</p>
          <a href={healingUrl} className="mt-4 inline-block text-sm font-semibold text-gold-300 hover:underline">Pure Conscious Healing →</a>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-sm md:grid-cols-1" aria-label="Footer">
          <Link href="/products" className="hover:text-crystal">All crystals</Link>
          <Link href="/account" className="hover:text-crystal">My account</Link>
          <Link href="/policies/shipping" className="hover:text-crystal">Shipping</Link>
          <Link href="/policies/returns" className="hover:text-crystal">Returns & refunds</Link>
          <Link href="/policies/privacy" className="hover:text-crystal">Privacy</Link>
          <Link href="/policies/terms" className="hover:text-crystal">Terms</Link>
        </nav>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3"><Phone className="size-4 text-amethyst-300" />{contact.phone}</li>
          <li className="flex gap-3"><MessageCircle className="size-4 text-amethyst-300" /><a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}>WhatsApp us</a></li>
          <li className="flex gap-3"><Mail className="size-4 text-amethyst-300" /><span className="break-all">{contact.email}</span></li>
          <li className="flex gap-3"><Truck className="size-4 text-amethyst-300" />Pan-India delivery · COD</li>
          <li className="flex gap-3"><ShieldCheck className="size-4 text-amethyst-300" />Secure payments by Razorpay</li>
        </ul>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-crystal/45">© {new Date().getFullYear()} Pure Crystal Hub · Prices inclusive of GST</div>
    </footer>
  );
}
