import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "ar"];
const defaultLocale = "en";

function getLocale(request: NextRequest): string {
  const accept = request.headers.get("accept-language") || "";
  return accept.toLowerCase().startsWith("ar") ? "ar" : defaultLocale;
}

export default function proxy(request: NextRequest) {
  // Update to strip default locale from URL
  const { pathname } = request.nextUrl;

  // Skip internal paths and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. If path starts with default locale (e.g., /en/...), redirect to stripped path
  if (
    pathname.startsWith(`/${defaultLocale}/`) ||
    pathname === `/${defaultLocale}`
  ) {
    const newPathname = pathname.replace(`/${defaultLocale}`, "");
    const newUrl = new URL(newPathname || "/", request.url);
    return NextResponse.redirect(newUrl);
  }

  // 2. If path has other locale (e.g., /ar/...), let it pass
  const hasOtherLocale = locales.some(
    (loc) =>
      loc !== defaultLocale &&
      (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`),
  );
  if (hasOtherLocale) {
    return NextResponse.next();
  }

  // 3. If path has no locale (e.g., /about), rewrite to default locale (e.g., /en/about)
  const newUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
  return NextResponse.rewrite(newUrl);
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
