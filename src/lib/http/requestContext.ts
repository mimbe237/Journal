import type { NextRequest } from "next/server";
import type { NextApiRequest } from "next";

// Récupère l'IP depuis les headers. TODO: améliorer avec une liste de proxies de confiance.
export function getClientIp(req: NextRequest | NextApiRequest): string | null {
  // x-forwarded-for peut contenir plusieurs IP (proxy), on prend la première.
  const xfwd = (req.headers as any)?.get?.("x-forwarded-for") || (req as any)?.headers?.["x-forwarded-for"];
  if (xfwd) return String(xfwd).split(",")[0].trim();
  const realIp = (req as any)?.headers?.["x-real-ip"];
  if (realIp) return String(realIp);
  return null;
}

// Récupère le user agent.
export function getUserAgent(req: NextRequest | NextApiRequest): string | null {
  const ua = (req.headers as any)?.get?.("user-agent") || (req as any)?.headers?.["user-agent"];
  return ua ? String(ua) : null;
}
