import { NextRequest, NextResponse } from "next/server";

import { authenticateUser, generateJwtForUser } from "@/modules/auth/authService";
import { setAuthCookie } from "@/lib/auth/authCookies";
import { logEvent } from "@/modules/logs/loggingService";
import { getClientIp, getUserAgent } from "@/lib/http/requestContext";
import type { UserRole } from "@prisma/client";

// Connexion utilisateur : vérifie les identifiants puis pose le cookie JWT.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, motDePasse } = body ?? {};

    const { user } = await authenticateUser({ email, motDePasse });
    const token = generateJwtForUser(user);

    const response = NextResponse.json({ user: publicUser(user) }, { status: 200 });
    setAuthCookie(response, token);

    // Log succès de connexion pour audit/fraude.
    await logEvent({
      type: "CONNEXION_REUSSIE",
      userId: user.id,
      ip: getClientIp(req),
      meta: { userAgent: getUserAgent(req) }
    });
    return response;
  } catch (error: any) {
    // Log échec de connexion (email tenté dans meta).
    await logEvent({
      type: "CONNEXION_ECHEC",
      userId: null,
      ip: getClientIp(req),
      meta: { email: error?.email ?? undefined, reason: error?.message ?? "invalid_credentials" }
    }).catch(() => {});

    return NextResponse.json({ error: error?.message ?? "Identifiants invalides" }, { status: 401 });
  }
}

function publicUser(user: { id: string; nom: string; email: string; role: UserRole }) {
  return {
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role
  };
}
