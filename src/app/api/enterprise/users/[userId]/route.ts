import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";

// DELETE retirer un utilisateur de l'entreprise
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const currentUser = await getCurrentUserFromRequest(req);
    
    if (!currentUser || currentUser.role !== UserRole.COMPTE_ENTREPRISE || !currentUser.enterpriseAccountId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Vérifier que l'utilisateur appartient à notre entreprise
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        enterpriseAccountId: currentUser.enterpriseAccountId,
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Empêcher de se retirer soi-même
    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous retirer vous-même" }, { status: 400 });
    }

    // Empêcher de retirer un autre admin
    if (targetUser.role === UserRole.COMPTE_ENTREPRISE) {
      return NextResponse.json({ error: "Vous ne pouvez pas retirer un autre administrateur" }, { status: 400 });
    }

    // Retirer l'utilisateur de l'entreprise (pas le supprimer, juste détacher)
    await prisma.user.update({
      where: { id: userId },
      data: {
        enterpriseAccountId: null,
        role: UserRole.ABONNE, // Revenir au rôle standard
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
