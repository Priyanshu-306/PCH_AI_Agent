"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3, Bell, BookOpen, CalendarDays, FileText, Gem, Image as ImageIcon, IndianRupee, LayoutDashboard, LogOut, Megaphone,
  Menu, MessageSquare, Package, Quote, ScrollText, Settings, ShoppingCart, Sparkles, Star, Tag, UserCog, Users, X,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

const NAV: { group: string; items: { href: string; label: string; icon: typeof Gem; perm: Permission }[] }[] = [
  { group: "Overview", items: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, perm: "analytics" },
    { href: "/admin/marketing", label: "Marketing spend", icon: Megaphone, perm: "marketing" },
  ] },
  { group: "Crystal Hub", items: [
    { href: "/admin/products", label: "Products", icon: Gem, perm: "products" },
    { href: "/admin/categories", label: "Categories", icon: Package, perm: "products" },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart, perm: "orders" },
    { href: "/admin/coupons", label: "Coupons", icon: Tag, perm: "coupons" },
    { href: "/admin/reviews", label: "Reviews", icon: Star, perm: "reviews" },
  ] },
  { group: "Healing", items: [
    { href: "/admin/services", label: "Services & courses", icon: Sparkles, perm: "services" },
    { href: "/admin/bookings", label: "Bookings", icon: CalendarDays, perm: "bookings" },
    { href: "/admin/enquiries", label: "Enquiries", icon: MessageSquare, perm: "enquiries" },
    { href: "/admin/trainers", label: "Trainers", icon: Users, perm: "trainers" },
    { href: "/admin/testimonials", label: "Testimonials", icon: Quote, perm: "testimonials" },
  ] },
  { group: "Website", items: [
    { href: "/admin/content", label: "Content editor", icon: FileText, perm: "content" },
    { href: "/admin/media", label: "Media library", icon: ImageIcon, perm: "media" },
  ] },
  { group: "System", items: [
    { href: "/admin/notifications", label: "Notifications", icon: Bell, perm: "dashboard" },
    { href: "/admin/audit", label: "Activity log", icon: ScrollText, perm: "audit" },
    { href: "/admin/staff", label: "Staff & roles", icon: UserCog, perm: "staff" },
    { href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings" },
  ] },
];

type Props = { perms: Permission[]; user: { name: string; role: string }; unread: number; healingUrl: string; shopUrl: string; logout: () => Promise<void> };

export default function Sidebar({ perms, user, unread, healingUrl, shopUrl, logout }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-lavender-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-xl hover:bg-lavender-50"><Menu className="size-5" /></button>
        <span className="font-bold text-plum-900">PCH Admin</span>
        <Link href="/admin/notifications" className="relative grid size-10 place-items-center rounded-xl hover:bg-lavender-50" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[0.6rem] font-bold text-white">{unread}</span>}
        </Link>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-lavender-200 bg-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-plum-700 to-lavender-400 text-white"><Sparkles className="size-4" /></span>
            <span className="leading-tight"><span className="block text-sm font-bold text-plum-900">Pure Conscious</span><span className="block text-[0.7rem] text-ink-soft">Admin panel</span></span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Admin">
          {NAV.map((g) => {
            const items = g.items.filter((i) => perms.includes(i.perm));
            if (!items.length) return null;
            return (
              <div key={g.group} className="mt-4">
                <p className="px-3 pb-1.5 text-[0.65rem] font-bold tracking-[0.14em] text-mist uppercase">{g.group}</p>
                {items.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active(href) ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${active(href) ? "bg-lavender-100 text-plum-800" : "text-ink-soft hover:bg-lavender-50 hover:text-plum-800"}`}>
                    <Icon className="size-4" />
                    <span className="flex-1">{label}</span>
                    {href === "/admin/notifications" && unread > 0 && <span className="rounded-full bg-red-600 px-1.5 text-[0.65rem] font-bold text-white">{unread}</span>}
                  </Link>
                ))}
              </div>
            );
          })}
          <div className="mt-6 space-y-1 border-t border-lavender-100 px-3 pt-4 text-xs">
            <a href={healingUrl} target="_blank" className="flex items-center gap-2 py-1 text-plum-700 hover:underline"><BookOpen className="size-3.5" />View healing site</a>
            <a href={shopUrl} target="_blank" className="flex items-center gap-2 py-1 text-plum-700 hover:underline"><IndianRupee className="size-3.5" />View crystal shop</a>
          </div>
        </nav>
        <div className="border-t border-lavender-100 p-4">
          <p className="truncate text-sm font-semibold text-plum-900">{user.name}</p>
          <p className="text-xs text-ink-soft">{user.role}</p>
          <form action={logout}><button className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-700 hover:underline"><LogOut className="size-3.5" />Sign out</button></form>
        </div>
      </aside>
    </>
  );
}
