import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/config/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";

// POST accepter une invitation
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: "Vous devez être connecté pour accepter une invitation" }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body ?? {};

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const invitation = await prisma.enterpriseInvitation.findUnique({
      where: { token },
      include: {
        enterpriseAccount: true
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

    // Vérifier que l'email correspond
    if (user.email !== invitation.email) {
      return NextResponse.json({ 
        error: "Cette invitation est destinée à une autre adresse email" 
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'est pas déjà dans une entreprise
    if (user.enterpriseAccountId) {
      return NextResponse.json({ 
        error: "Vous faites déjà partie d'une entreprise. Quittez d'abord votre entreprise actuelle." 
      }, { status: 400 });
    }

    // Vérifier qu'il reste des places
    const usersCount = await prisma.user.count({
      where: { enterpriseAccountId: invitation.enterpriseAccountId }
    });

    if (usersCount >= invitation.enterpriseAccount.nombreUtilisateursInclus) {
      return NextResponse.json({ 
        error: "Cette entreprise n'a plus de licences disponibles" 
      }, { status: 400 });
    }

    // Ajouter l'utilisateur à l'entreprise
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          enterpriseAccountId: invitation.enterpriseAccountId,
          role: invitation.role as UserRole,
        }
      }),
      prisma.enterpriseInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      })
    ]);

    return NextResponse.json({ 
      success: true,
      message: `Vous avez rejoint ${invitation.enterpriseAccount.nom}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
