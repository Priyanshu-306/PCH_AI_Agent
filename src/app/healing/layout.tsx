import type { Metadata } from "next";
import { Suspense } from "react";
import { getDict } from "@/i18n/server";
import { getContent } from "@/lib/content";
import { getSetting } from "@/lib/settings";
import { featuredProducts } from "@/lib/queries";
import { crystalTone } from "@/lib/crystal-colors";
import { SHOP_URL } from "@/lib/site";
import SmoothScroll from "@/components/common/SmoothScroll";
import Track from "@/components/common/Track";
import WhatsAppButton from "@/components/common/WhatsAppButton";
import HealingBackdrop from "@/components/healing/HealingBackdrop";
import Header from "@/components/healing/Header";
import Footer from "@/components/healing/Footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Pure Conscious Healing — Clinical Hypnotherapy & Energy Healing", template: "%s · Pure Conscious Healing" },
  description:
    "Clinical hypnotherapy, chakra balancing, energy alignment, emotional healing, past life regression and prenatal support — online and in person. Certification courses in clinical hypnotherapy.",
};

export default async function HealingLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  const [c, contact, featured] = await Promise.all([getContent("healing", lang), getSetting("contact"), featuredProducts(6)]);
  const crystalColors = featured.length ? featured.map(({ p }) => crystalTone(p.crystals).base) : ["#9b6ad6", "#f2b8c8", "#f2b84b", "#5fae7a", "#46a8e0"];
  const labels = { ...t.nav, language: t.common.language };
  return (
    <>
      <SmoothScroll />
      <HealingBackdrop crystalColors={crystalColors} />
      <Header lang={lang} logo={c("brand.logo")} labels={labels} shopUrl={SHOP_URL} />
      <main id="main">{children}</main>
      <Footer tagline={c("footer.tagline")} contact={contact} labels={labels} shopUrl={SHOP_URL} />
      <WhatsAppButton number={contact.whatsapp} />
      <Suspense>
        <Track site="healing" />
      </Suspense>
    </>
  );
}
