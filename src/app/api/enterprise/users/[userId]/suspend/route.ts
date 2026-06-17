/**
 * API Route pour suspendre un utilisateur
 * NOTE: Cette fonctionnalité nécessite la migration enterprise_admin_system
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";
import { EnterpriseUserStatus, EnterpriseUserRole } from "@prisma/client";

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
    const { reason } = body;

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

    // Mise à jour standard Prisma
    await prisma.user.update({
      where: { id: userId },
      data: {
        enterpriseStatus: EnterpriseUserStatus.SUSPENDU,
        enterpriseRole: EnterpriseUserRole.SUSPENDU,
        suspendedReason: reason || 'Suspendu par un administrateur',
        suspendedAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur POST /api/enterprise/users/[userId]/suspend:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
