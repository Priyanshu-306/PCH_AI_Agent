export type Site = "healing" | "shop";

const list = (v: string | undefined, fallback: string) =>
  (v ?? fallback)
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

export function siteForHost(hostHeader: string | null): Site {
  const host = (hostHeader ?? "").split(":")[0].toLowerCase();
  const shopHosts = list(process.env.SHOP_HOSTS, "shop.localhost,purecrystalhub.com,www.purecrystalhub.com");
  if (shopHosts.includes(host) || host.startsWith("shop.")) return "shop";
  return "healing";
}

// Read at runtime (not NEXT_PUBLIC_*, which Next.js bakes in at build time), so one Docker
// image works on a laptop and on the live domains.
export const HEALING_URL = process.env.HEALING_URL ?? "http://localhost:3005";
export const SHOP_URL = process.env.SHOP_URL ?? "http://shop.localhost:3005";

export const siteUrl = (site: Site, path = "/") => `${site === "shop" ? SHOP_URL : HEALING_URL}${path}`;
