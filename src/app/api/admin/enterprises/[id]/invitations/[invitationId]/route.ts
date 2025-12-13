import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

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

    // Vérifier ou créer l'utilisateur
    let user = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (!user) {
      // Créer un nouvel utilisateur
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          nom: invitation.email.split('@')[0],
          role: invitation.role,
          enterpriseAccountId: id,
          emailVerified: new Date(),
        }
      });
    } else if (!user.enterpriseAccountId) {
      // L'utilisateur existe mais n'est pas lié à l'entreprise
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: invitation.role,
          enterpriseAccountId: id,
        }
      });
    } else if (user.enterpriseAccountId !== id) {
      return NextResponse.json({ error: "Cet utilisateur est déjà associé à une autre entreprise" }, { status: 400 });
    }

    // Marquer l'invitation comme acceptée
    const updatedInvitation = await prisma.enterpriseInvitation.update({
      where: { id: invitationId },
      data: { acceptedAt: new Date() }
    });

    return NextResponse.json({ invitation: updatedInvitation, user });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la validation" }, { status: 400 });
  }
}
