import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";

// GET dashboard data for enterprise admin
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.COMPTE_ENTREPRISE) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs d'entreprise" }, { status: 403 });
    }

    if (!user.enterpriseAccountId) {
      return NextResponse.json({ error: "Aucun compte entreprise associé" }, { status: 400 });
    }

    const enterprise = await prisma.enterpriseAccount.findUnique({
      where: { id: user.enterpriseAccountId },
      select: {
        id: true,
        nom: true,
        contactEmail: true,
        nombreUtilisateursInclus: true,
        niveauSla: true,
        actif: true,
      }
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: { enterpriseAccountId: user.enterpriseAccountId },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        dernierLoginAt: true,
      },
      orderBy: { nom: 'asc' }
    });

    const pendingInvitations = await prisma.enterpriseInvitation.count({
      where: {
        enterpriseAccountId: user.enterpriseAccountId,
        acceptedAt: null,
        expireAt: { gt: new Date() }
      }
    });

    const subscription = await prisma.subscription.findFirst({
      where: {
        enterpriseAccountId: user.enterpriseAccountId,
        statut: 'ACTIF',
      },
      select: {
        type: true,
        statut: true,
        dateFin: true,
      },
      orderBy: { dateFin: 'desc' }
    });

    return NextResponse.json({
      enterprise,
      users,
      pendingInvitations,
      subscription,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
