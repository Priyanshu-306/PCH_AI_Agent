import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contentBlocks } from "@/db/schema";
import type { Lang } from "@/i18n/dictionaries";
import { contentDefaults } from "./content-registry";

/** Returns a lookup for one site's editable content in the requested language. */
export async function getContent(site: "healing" | "shop", lang: Lang) {
  const rows = await db.select().from(contentBlocks).where(eq(contentBlocks.site, site));
  const map = new Map<string, string>();
  for (const def of contentDefaults(site)) map.set(def.key, (lang === "hi" && def.hi) || def.en);
  for (const r of rows) {
    const v = (lang === "hi" && r.valueHi) || r.valueEn;
    if (v || r.valueEn === "") map.set(r.key, v);
  }
  return (key: string) => map.get(`${site}.${key}`) ?? "";
}
