import type { NextRequest } from "next/server";
import type { NextApiRequest } from "next";
import { User, UserRole } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";

export class AuthorizationError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

// Vérifie qu'un utilisateur est connecté et possède l'un des rôles autorisés.
export async function requireUserWithRoles(
  req: NextRequest | NextApiRequest,
  // res param conservé pour compat éventuelle (API Routes), non utilisé ici (App Router).
  _res: Response | undefined,
  rolesAutorises: UserRole[]
): Promise<User> {
  const user = await getCurrentUserFromRequest(req);
  if (!user) {
    throw new AuthorizationError("Utilisateur non authentifié", 401);
  }

  if (!rolesAutorises.includes(user.role)) {
    throw new AuthorizationError("Accès interdit", 403);
  }

  return user;
}
