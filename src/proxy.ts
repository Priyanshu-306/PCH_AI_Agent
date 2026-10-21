import { NextResponse, type NextRequest } from "next/server";
import { siteForHost, siteUrl } from "@/lib/site";

const VISITOR_COOKIE = "pch_vid";

// Each brand is served from its own domain by one app: requests are rewritten to
// /healing/* or /shop/* based on the Host header. /admin is shared by both domains.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const isLogin = pathname === "/admin/login";
    if (!isLogin && !request.cookies.has("pch_staff")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Internal prefixes are not public URLs: send them to the right domain without the prefix.
  const internal = pathname.match(/^\/(healing|shop)(\/.*)?$/);
  if (internal) {
    return NextResponse.redirect(siteUrl(internal[1] as "healing" | "shop", (internal[2] ?? "/") + search));
  }

  const site = siteForHost(request.headers.get("host"));
  const url = request.nextUrl.clone();
  url.pathname = `/${site}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.rewrite(url);

  if (!request.cookies.has(VISITOR_COOKIE)) {
    response.cookies.set(VISITOR_COOKIE, crypto.randomUUID().replace(/-/g, "").slice(0, 24), {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|media|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
