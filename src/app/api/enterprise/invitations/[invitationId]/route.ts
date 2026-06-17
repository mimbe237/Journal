/**
 * API Route pour annuler une invitation
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";
import { canAdminEnterprise } from "@/modules/enterprises/enterpriseAdminService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !user.enterpriseAccountId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { allowed } = await canAdminEnterprise(user.id, user.enterpriseAccountId);
    if (!allowed) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { invitationId } = await params;

    // Vérifier que l'invitation appartient à cette entreprise
    const invitation = await prisma.enterpriseInvitation.findFirst({
      where: {
        id: invitationId,
        enterpriseAccountId: user.enterpriseAccountId,
        acceptedAt: null
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
    }

    // Supprimer l'invitation
    await prisma.enterpriseInvitation.delete({
      where: { id: invitationId }
    });

    // Mettre à jour le compteur d'invités si le champ existe
    try {
      await prisma.$executeRaw`UPDATE enterprise_accounts SET "nombreUtilisateursInvites" = "nombreUtilisateursInvites" - 1 WHERE id = ${user.enterpriseAccountId}`;
    } catch {
      // Le champ n'existe peut-être pas encore
    }

    // Log d'audit
    try {
      await prisma.$executeRaw`
        INSERT INTO enterprise_audit_logs (id, "enterpriseAccountId", action, "performedBy", "changedFields", "performedAt")
        VALUES (gen_random_uuid(), ${user.enterpriseAccountId}, 'INVITATION_CANCELLED', ${user.id}, ${JSON.stringify({ email: invitation.email, invitationId })}::jsonb, NOW())
      `;
    } catch {
      // La table n'existe peut-être pas encore
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE /api/enterprise/invitations/[invitationId]:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
