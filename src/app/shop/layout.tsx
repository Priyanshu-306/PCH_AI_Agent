import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getDict } from "@/i18n/server";
import { pick } from "@/i18n/dictionaries";
import { getContent } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { HEALING_URL } from "@/lib/site";
import SmoothScroll from "@/components/common/SmoothScroll";
import Track from "@/components/common/Track";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import ShopHeader from "@/components/shop/ShopHeader";
import ShopFooter from "@/components/shop/ShopFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Pure Crystal Hub — Natural, Energised Healing Crystals", template: "%s · Pure Crystal Hub" },
  description: "Natural crystal bracelets, towers, clusters, malas and healing kits — hand-picked and energised by the healers at Pure Conscious Healing. Pan-India delivery, COD available.",
};

export const viewport: Viewport = { themeColor: "#0e0819" };

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  const [c, contact, cats] = await Promise.all([getContent("shop", lang), getSetting("contact"), db.select().from(categories).orderBy(asc(categories.sort))]);
  return (
    <div className="min-h-screen bg-night-900 text-crystal">
      <style>{`body{background:#0e0819;color:#f8f6ff}`}</style>
      <SmoothScroll />
      <ShopHeader
        lang={lang}
        logo={c("brand.logo")}
        announcement={c("announcement")}
        categories={cats.map((x) => ({ slug: x.slug, name: pick(x, "name", lang) }))}
        labels={{ ...t.nav, language: t.common.language }}
        healingUrl={HEALING_URL}
      />
      <main id="main">{children}</main>
      <ShopFooter contact={contact} about={c("about.body")} healingUrl={HEALING_URL} />
      <WhatsAppButton number={contact.whatsapp} text="Namaste! I have a question about a crystal." />
      <Suspense>
        <Track site="shop" />
      </Suspense>
    </div>
  );
}
