import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope, Marcellus, Mukta, Tiro_Devanagari_Hindi } from "next/font/google";
import { getLang } from "@/i18n/server";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const sans = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const marcellus = Marcellus({ variable: "--font-marcellus", subsets: ["latin"], weight: "400" });
const devaSans = Mukta({ variable: "--font-mukta", subsets: ["devanagari"], weight: ["300", "400", "500", "600"] });
const devaDisplay = Tiro_Devanagari_Hindi({ variable: "--font-tiro", subsets: ["devanagari"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Pure Conscious Healing",
  description: "Holistic healing, clinical hypnotherapy and energised crystals.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f2fb",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      className={`${display.variable} ${sans.variable} ${marcellus.variable} ${devaSans.variable} ${devaDisplay.variable} antialiased`}
      data-lang={lang}
    >
      <body>{children}</body>
    </html>
  );
}
