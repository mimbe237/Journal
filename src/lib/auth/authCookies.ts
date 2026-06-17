import type { NextRequest } from "next/server";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseCookiesLike = { set: (...args: any[]) => any };

// Nom unique du cookie d'auth utilisé partout (middleware, API, clients).
export const AUTH_COOKIE_NAME = "journal_auth";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 jours

type ResponseWithCookies = { cookies: ResponseCookiesLike } | NextApiResponse;

// Pose un cookie httpOnly avec le JWT. Secure seulement en prod.
export function setAuthCookie(res: ResponseWithCookies, token: string) {
  if ("cookies" in res && typeof res.cookies?.set === "function") {
    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      path: "/"
    });
    return;
  }

  // Compatibilité NextApiResponse (legacy API Routes).
  (res as NextApiResponse).setHeader("Set-Cookie", [
    serializeCookie(token, AUTH_COOKIE_MAX_AGE_SECONDS)
  ]);
}

// Supprime le cookie d'auth (logout).
export function clearAuthCookie(res: ResponseWithCookies) {
  if ("cookies" in res && typeof res.cookies?.set === "function") {
    res.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/"
    });
    return;
  }

  (res as NextApiResponse).setHeader("Set-Cookie", [serializeCookie("", 0)]);
}

// Récupère le JWT depuis la requête (cookies).
export function getJwtFromRequest(req: NextRequest | NextApiRequest): string | null {
  // App Router (NextRequest)
  if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
    const cookie = (req as NextRequest).cookies.get(AUTH_COOKIE_NAME);
    return cookie?.value ?? null;
  }

  // API Routes (cookies objet)
  if ("cookies" in req && (req as NextApiRequest).cookies) {
    const cookieValue = (req as NextApiRequest).cookies[AUTH_COOKIE_NAME];
    return cookieValue ?? null;
  }

  return null;
}

// Sérialisation manuelle pour compat legacy API Routes.
function serializeCookie(value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${AUTH_COOKIE_NAME}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
