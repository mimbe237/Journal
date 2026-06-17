import { NextRequest, NextResponse } from "next/server";
import { EnterpriseUserRole, EnterpriseUserStatus, UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

function mapEnterpriseRoleToUserRole(role: EnterpriseUserRole): UserRole {
  switch (role) {
    case EnterpriseUserRole.ADMIN_PRIMAIRE:
    case EnterpriseUserRole.ADMIN_SECONDAIRE:
    case EnterpriseUserRole.MANAGER:
      return UserRole.COMPTE_ENTREPRISE;
    default:
      return UserRole.UTILISATEUR_ENTREPRISE;
  }
}

// DELETE annuler une invitation
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const { id, invitationId } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);

    const invitation = await prisma.enterpriseInvitation.findFirst({
      where: { 
        id: invitationId,
        enterpriseAccountId: id 
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Cette invitation a déjà été acceptée" }, { status: 400 });
    }

    await prisma.enterpriseInvitation.delete({
      where: { id: invitationId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'annulation" }, { status: 400 });
  }
}

// PATCH valider/accepter une invitation (admin)
export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string; invitationId: string }> }
) {
  try {
    const { id, invitationId } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);

    const invitation = await prisma.enterpriseInvitation.findFirst({
      where: { 
        id: invitationId,
        enterpriseAccountId: id 
      },
      include: {
        enterpriseAccount: true
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Cette invitation a déjà été acceptée" }, { status: 400 });
    }

    if (new Date() > invitation.expireAt) {
      return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 400 });
    }

    const normalizedEmail = invitation.email.toLowerCase();
    const targetUserRole = mapEnterpriseRoleToUserRole(invitation.role);
    const assignmentDate = new Date();

    // Vérifier ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    let updateEnterpriseCounters = false;

    if (!user) {
      // Créer un nouvel utilisateur
      const bcrypt = await import("bcrypt");
      const tempPassword = `PENDING_ACTIVATION_${Math.random().toString(36).slice(2)}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          nom: normalizedEmail.split("@")[0] ?? normalizedEmail,
          role: targetUserRole,
          enterpriseAccountId: id,
          enterpriseRole: invitation.role,
          enterpriseStatus: EnterpriseUserStatus.ACTIF,
          dateAssignmentEnterprise: assignmentDate,
          motDePasseHash: hashedPassword
        }
      });
      updateEnterpriseCounters = true;
    } else if (!user.enterpriseAccountId) {
      // L'utilisateur existe mais n'est pas lié à l'entreprise
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: targetUserRole,
          enterpriseAccountId: id,
          enterpriseRole: invitation.role,
          enterpriseStatus: EnterpriseUserStatus.ACTIF,
          dateAssignmentEnterprise: assignmentDate,
        }
      });
      updateEnterpriseCounters = true;
    } else if (user.enterpriseAccountId !== id) {
      return NextResponse.json({ error: "Cet utilisateur est déjà associé à une autre entreprise" }, { status: 400 });
    } else if (
      user.role !== targetUserRole ||
      user.enterpriseRole !== invitation.role ||
      user.enterpriseStatus !== EnterpriseUserStatus.ACTIF
    ) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: targetUserRole,
          enterpriseRole: invitation.role,
          enterpriseStatus: EnterpriseUserStatus.ACTIF,
          dateAssignmentEnterprise: assignmentDate
        }
      });
    }

    // Marquer l'invitation comme acceptée
    const updatedInvitation = await prisma.enterpriseInvitation.update({
      where: { id: invitationId },
      data: { acceptedAt: assignmentDate, acceptedByUserId: user.id }
    });

    if (updateEnterpriseCounters) {
      await prisma.enterpriseAccount.update({
        where: { id },
        data: {
          nombreUtilisateursInvites: { decrement: 1 },
          nombreUtilisateursActifs: { increment: 1 }
        }
      });
    }

    return NextResponse.json({ invitation: updatedInvitation, user });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la validation" }, { status: 400 });
  }
}
