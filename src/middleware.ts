import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Signale aux layouts que la page est une vue invité (sans header)
  if (request.nextUrl.pathname.startsWith("/lire/invite/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-guest-view", "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|icons|favicon).*)"],
};
