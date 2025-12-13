import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { assignUserToEnterpriseAccount } from "@/modules/enterprises/enterpriseService";
import { prisma } from "@/lib/config/prisma";

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.COMPTE_ENTREPRISE]);
    const actingUser = await getCurrentUserFromRequest(req);
    if (!actingUser?.enterpriseAccountId) {
      return NextResponse.json({ error: "Aucun compte entreprise associé" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body ?? {};
    if (role !== UserRole.UTILISATEUR_ENTREPRISE && role !== "UTILISATEUR_ENTREPRISE") {
      return NextResponse.json({ error: "Seul le rôle UTILISATEUR_ENTREPRISE est autorisé" }, { status: 400 });
    }

    // Vérifier que la cible n'est pas déjà liée à une autre entreprise.
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return NextResponse.json({ error: "Utilisateur cible introuvable" }, { status: 404 });
    if (target.enterpriseAccountId && target.enterpriseAccountId !== actingUser.enterpriseAccountId) {
      return NextResponse.json({ error: "Utilisateur déjà rattaché à une autre entreprise" }, { status: 400 });
    }

    const user = await assignUserToEnterpriseAccount({
      enterpriseAccountId: actingUser.enterpriseAccountId,
      userId,
      role: "UTILISATEUR_ENTREPRISE"
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'affectation" }, { status: 400 });
  }
}
