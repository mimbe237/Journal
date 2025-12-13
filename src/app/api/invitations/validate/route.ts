import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/config/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";

// GET valider un token d'invitation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const invitation = await prisma.enterpriseInvitation.findUnique({
      where: { token },
      include: {
        enterpriseAccount: {
          select: { nom: true }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Cette invitation a déjà été utilisée" }, { status: 400 });
    }

    if (new Date() > invitation.expireAt) {
      return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email }
    });

    return NextResponse.json({
      invitation: {
        enterpriseName: invitation.enterpriseAccount.nom,
        email: invitation.email,
        expireAt: invitation.expireAt,
      },
      needsRegistration: !existingUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
