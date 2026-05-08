import { NextResponse, type NextRequest } from "next/server";

const defaultLocale = "vi";
const supportedLocales = ["en", "vi"] as const;
type SupportedLocale = (typeof supportedLocales)[number];

function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocales.includes(value as SupportedLocale);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (isSupportedLocale(firstSegment)) {
    return NextResponse.next();
  }

  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname =
    pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;

  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
