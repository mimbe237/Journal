import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth/authCookies";

// Routes qui nécessitent une authentification
const protectedRoutes = ["/dashboard", "/editions", "/subscriptions", "/profile"];
const adminRoutes = ["/admin"];

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.userId) return false;
  if (payload.exp && Date.now() / 1000 >= payload.exp) return false;
  return true;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip proxy for API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Routes invité : injecter x-guest-view pour masquer le Header
  if (pathname.startsWith("/lire/invite/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-guest-view", "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Récupérer le token depuis les cookies
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = token ? isTokenValid(token) : false;
  
  // Vérifier si la route est protégée
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  
  // Si pas de token et route protégée -> redirect vers login
  if (!authenticated && (isProtectedRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(url);
    if (token) {
      response.cookies.delete(AUTH_COOKIE_NAME);
    }
    return response;
  }
  
  // Si authentifié et sur page login/register -> redirect dashboard
  if (authenticated && (pathname === "/auth/login" || pathname === "/auth/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
