/**
 * API Route pour réactiver un utilisateur suspendu
 * NOTE: Cette fonctionnalité nécessite la migration enterprise_admin_system
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !user.enterpriseAccountId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json().catch(() => ({}));
    const { role } = body;
    const newRole = role || "UTILISATEUR";

    // Vérifier que l'utilisateur cible appartient à la même entreprise
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        enterpriseAccountId: user.enterpriseAccountId
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Utiliser $executeRaw pour éviter les problèmes de types
    try {
      await prisma.$executeRaw`
        UPDATE users 
        SET "enterpriseStatus" = 'ACTIF'::"EnterpriseUserStatus",
            "enterpriseRole" = ${newRole}::"EnterpriseUserRole",
            "suspendedReason" = NULL,
            "suspendedAt" = NULL
        WHERE id = ${userId}
      `;
    } catch {
      return NextResponse.json({ error: "Fonctionnalité non disponible - migration requise" }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur POST /api/enterprise/users/[userId]/reactivate:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
