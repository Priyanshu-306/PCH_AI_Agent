import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { Facebook, Instagram, Youtube } from "../common/BrandIcons";
import type { Settings } from "@/lib/settings";

type Props = {
  tagline: string;
  contact: Settings["contact"];
  labels: { services: string; courses: string; trainers: string; about: string; crystals: string; contact: string; book: string };
  shopUrl: string;
};

export default function Footer({ tagline, contact, labels, shopUrl }: Props) {
  const socials = [
    { href: contact.instagram, icon: Instagram, label: "Instagram" },
    { href: contact.facebook, icon: Facebook, label: "Facebook" },
    { href: contact.youtube, icon: Youtube, label: "YouTube" },
  ].filter((s) => s.href);
  return (
    <footer className="relative mt-24 border-t border-lavender-200/70 bg-white/55 backdrop-blur-xl">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-display text-3xl font-semibold text-plum-800">Pure Conscious Healing</div>
          <p className="mt-3 max-w-sm text-ink-soft">{tagline}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socials.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-lavender-300 text-plum-700 hover:bg-lavender-100">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        <nav className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-1" aria-label="Footer">
          <Link href="/services" className="hover:text-plum-700">{labels.services}</Link>
          <Link href="/courses" className="hover:text-plum-700">{labels.courses}</Link>
          <Link href="/trainers" className="hover:text-plum-700">{labels.trainers}</Link>
          <Link href="/about" className="hover:text-plum-700">{labels.about}</Link>
          <a href={shopUrl} className="hover:text-plum-700">{labels.crystals} · Pure Crystal Hub</a>
          <Link href="/contact" className="hover:text-plum-700">{labels.contact}</Link>
        </nav>
        <ul className="space-y-3 text-sm text-ink-soft">
          <li className="flex gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-plum-600" /><a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a></li>
          <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-plum-600" /><a href={`mailto:${contact.email}`} className="break-all">{contact.email}</a></li>
          <li className="flex gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-plum-600" />{contact.hours}</li>
          <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-plum-600" />{contact.address}</li>
        </ul>
      </div>
      <div className="border-t border-lavender-200/70">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Pure Conscious Healing. All rights reserved.</span>
          <span className="flex flex-wrap gap-4">
            <Link href="/policies/privacy">Privacy</Link>
            <Link href="/policies/terms">Terms</Link>
            <Link href="/policies/refunds">Cancellations & refunds</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
