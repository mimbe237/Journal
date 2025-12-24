import type { NextRequest } from "next/server";
import type { NextApiRequest } from "next";
import { cookies } from "next/headers";

import { prisma } from "@/lib/config/prisma";
import { getJwtFromRequest, AUTH_COOKIE_NAME } from "@/lib/auth/authCookies";
import { verifyJwt } from "@/modules/auth/authService";

// Retourne l'utilisateur courant à partir du JWT présent dans les cookies. Null si absent/invalide.
export async function getCurrentUserFromRequest(req: NextRequest | NextApiRequest) {
  try {
    const token = getJwtFromRequest(req);
    if (!token) return null;

    const payload = verifyJwt(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    return user;
  } catch (error) {
    console.error("[getCurrentUserFromRequest] Critical error:", error);
    return null;
  }
}

// Helper pour Server Components
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwt(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    return user;
  } catch (error) {
    console.error("[getCurrentUser] Error retrieving user:", error);
    return null;
  }
}
