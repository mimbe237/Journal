/**
 * API Route pour changer le rôle d'un utilisateur
 * NOTE: Cette fonctionnalité nécessite la migration enterprise_admin_system
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !user.enterpriseAccountId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "Rôle requis" }, { status: 400 });
    }

    // Vérifier que l'utilisateur cible appartient à la même entreprise
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        enterpriseAccountId: user.enterpriseAccountId
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé dans cette entreprise" }, { status: 404 });
    }

    // Utiliser $executeRaw pour éviter les problèmes de types
    try {
      await prisma.$executeRaw`UPDATE users SET "enterpriseRole" = ${role}::"EnterpriseUserRole" WHERE id = ${userId}`;
    } catch {
      return NextResponse.json({ error: "Fonctionnalité non disponible - migration requise" }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur PUT /api/enterprise/users/[userId]/role:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
