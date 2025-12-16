/**
 * API Route pour accepter une invitation entreprise
 * NOTE: Cette fonctionnalité nécessite la migration enterprise_admin_system
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, nom, password } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    if (!nom || !password) {
      return NextResponse.json({ error: "Nom et mot de passe requis" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères" }, { status: 400 });
    }

    // Trouver l'invitation
    const invitation = await prisma.enterpriseInvitation.findUnique({
      where: { token },
      include: { enterpriseAccount: { select: { id: true, nom: true } } }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Cette invitation a déjà été utilisée" }, { status: 400 });
    }

    if (invitation.expireAt < new Date()) {
      return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    if (existingUser) {
      if (existingUser.enterpriseAccountId) {
        return NextResponse.json({ error: "Cet utilisateur appartient déjà à une entreprise" }, { status: 400 });
      }

      // Rattacher l'utilisateur existant à l'entreprise
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          enterpriseAccountId: invitation.enterpriseAccountId,
          role: UserRole.UTILISATEUR_ENTREPRISE
        }
      });

      // Mettre à jour les champs enterprise si disponibles
      try {
        await prisma.$executeRaw`
          UPDATE users SET 
            "enterpriseRole" = ${invitation.role}::"EnterpriseUserRole",
            "enterpriseStatus" = 'ACTIF'::"EnterpriseUserStatus",
            "dateAssignmentEnterprise" = NOW()
          WHERE id = ${existingUser.id}
        `;
      } catch {
        // Champs non disponibles
      }

      await prisma.enterpriseInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      });

      return NextResponse.json({ 
        success: true,
        message: "Invitation acceptée. Vous pouvez maintenant vous connecter.",
        userId: existingUser.id
      });
    }

    // Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nom,
        email: invitation.email,
        motDePasseHash: hashedPassword,
        role: UserRole.UTILISATEUR_ENTREPRISE,
        enterpriseAccountId: invitation.enterpriseAccountId
      }
    });

    // Mettre à jour les champs enterprise si disponibles
    try {
      await prisma.$executeRaw`
        UPDATE users SET 
          "enterpriseRole" = ${invitation.role}::"EnterpriseUserRole",
          "enterpriseStatus" = 'ACTIF'::"EnterpriseUserStatus",
          "dateAssignmentEnterprise" = NOW()
        WHERE id = ${newUser.id}
      `;
    } catch {
      // Champs non disponibles
    }

    await prisma.enterpriseInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });

    return NextResponse.json({ 
      success: true,
      message: "Compte créé. Vous pouvez maintenant vous connecter.",
      userId: newUser.id
    });
  } catch (error: any) {
    console.error("Erreur POST /api/enterprise/invitations/accept:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
