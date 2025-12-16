/**
 * API Route pour inviter un utilisateur dans l'entreprise
 * NOTE: Cette fonctionnalité nécessite la migration enterprise_admin_system
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";
import { randomBytes } from "crypto";
import { emailProvider } from "@/services/email";

const EnterpriseUserRole = {
  ADMIN_PRIMAIRE: "ADMIN_PRIMAIRE",
  ADMIN_SECONDAIRE: "ADMIN_SECONDAIRE",
  MANAGER: "MANAGER",
  UTILISATEUR: "UTILISATEUR",
  SUSPENDU: "SUSPENDU"
} as const;

type EnterpriseUserRoleType = typeof EnterpriseUserRole[keyof typeof EnterpriseUserRole];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !user.enterpriseAccountId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Valider le rôle (default: UTILISATEUR)
    const validRole: EnterpriseUserRoleType = 
      role && Object.values(EnterpriseUserRole).includes(role) 
        ? role 
        : EnterpriseUserRole.UTILISATEUR;

    // Vérifier si l'email n'est pas déjà utilisé dans cette entreprise
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        enterpriseAccountId: user.enterpriseAccountId
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Cet utilisateur fait déjà partie de l'entreprise" }, { status: 400 });
    }

    // Vérifier invitation existante
    const existingInvite = await prisma.enterpriseInvitation.findFirst({
      where: {
        enterpriseAccountId: user.enterpriseAccountId,
        email: email.toLowerCase(),
        acceptedAt: null,
        expireAt: { gt: new Date() }
      }
    });

    if (existingInvite) {
      return NextResponse.json({ error: "Une invitation est déjà en attente pour cet email" }, { status: 400 });
    }

    // Créer l'invitation
    const token = randomBytes(32).toString("hex");
    const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const invitation = await prisma.enterpriseInvitation.create({
      data: {
        enterpriseAccountId: user.enterpriseAccountId,
        email: email.toLowerCase(),
        role: validRole,
        token,
        expireAt
      }
    });

    // Récupérer le nom de l'entreprise
    const enterprise = await prisma.enterpriseAccount.findUnique({
      where: { id: user.enterpriseAccountId },
      select: { nom: true }
    });

    // Envoyer l'email
    try {
      await emailProvider.sendEmail({
        to: email,
        subject: `Invitation à rejoindre ${enterprise?.nom ?? "l'entreprise"} sur Journal Digital`,
        html: `
          <h1>Vous êtes invité !</h1>
          <p>${enterprise?.nom ?? "Une entreprise"} vous invite à rejoindre leur espace de lecture sur Journal Digital.</p>
          <p>Cliquez sur le lien ci-dessous pour accepter l'invitation (valide 7 jours) :</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/invitation/accept?token=${token}">
            Accepter l'invitation
          </a>
        `
      });
    } catch (e) {
      console.error("Erreur envoi email invitation:", e);
    }

    return NextResponse.json({ 
      success: true, 
      invitationId: invitation.id
    });
  } catch (error: any) {
    console.error("Erreur POST /api/enterprise/users/invite:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
