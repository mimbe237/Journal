import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { registerUser, authenticateUser, generateJwtForUser } from "@/modules/auth/authService";
import { setAuthCookie } from "@/lib/auth/authCookies";
import { getRegistrationEnabled } from "@/modules/settings/appSettingsService";

// Inscription utilisateur et connexion directe (set du cookie JWT).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, email, motDePasse, role } = body ?? {};

    const registrationsOpen = await getRegistrationEnabled();
    if (!registrationsOpen) {
      return NextResponse.json(
        { error: "Les inscriptions sont désactivées. Contactez un administrateur." },
        { status: 403 }
      );
    }

    const user = await registerUser({
      nom,
      email,
      motDePasse,
      role: role ?? UserRole.ABONNE
    });

    // On ré-authentifie pour rester homogène (vérifie le hash).
    const { user: authenticatedUser } = await authenticateUser({ email, motDePasse });
    const token = generateJwtForUser(authenticatedUser);

    const response = NextResponse.json({ user: publicUser(authenticatedUser) }, { status: 201 });
    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 400 });
  }
}

// Retire les infos sensibles avant de répondre.
function publicUser(user: { id: string; nom: string; email: string; role: UserRole }) {
  return {
    id: user.id,
    nom: user.nom,
    email: user.email,
    role: user.role
  };
}
