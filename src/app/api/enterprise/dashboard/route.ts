import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";
import { EnterpriseUserRole } from "@prisma/client";

// GET dashboard data for enterprise admin
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!user.enterpriseAccountId) {
      return NextResponse.json({ error: "Aucun compte entreprise associé" }, { status: 400 });
    }

    // Vérifier les droits d'admin
    let isAdmin = false;
    let role: EnterpriseUserRole | null = null;
    
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { enterpriseRole: true }
    });
    
    if (userWithRole?.enterpriseRole) {
      role = userWithRole.enterpriseRole;
      isAdmin =
        role === EnterpriseUserRole.ADMIN_PRIMAIRE ||
        role === EnterpriseUserRole.ADMIN_SECONDAIRE ||
        role === EnterpriseUserRole.MANAGER;
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

    // Récupérer les utilisateurs (seulement pour les admins)
    let users: any[] = [];
    if (isAdmin) {
      users = await prisma.user.findMany({
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
    }

    // Récupérer les invitations en attente (seulement pour les admins)
    let pendingInvitations: any[] = [];
    if (isAdmin) {
      pendingInvitations = await prisma.enterpriseInvitation.findMany({
        where: {
          enterpriseAccountId: user.enterpriseAccountId,
          acceptedAt: null,
          expireAt: { gt: new Date() }
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          expireAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Récupérer les abonnements
    const subscriptions = await prisma.subscription.findMany({
      where: {
        enterpriseAccountId: user.enterpriseAccountId,
        deletedAt: null,
      },
      select: {
        id: true,
        type: true,
        statut: true,
        dateDebut: true,
        dateFin: true,
        journalType: {
          select: { id: true, nom: true, code: true }
        }
      },
      orderBy: { dateFin: 'desc' },
      take: 10
    });

    // Calculer des stats simples
    const stats = {
      totalUsers: users.length,
      totalLicenses: enterprise.nombreUtilisateursInclus ?? 0,
      pendingInvitations: pendingInvitations.length,
      activeSubscriptions: subscriptions.filter(s => s.statut === 'ACTIF').length
    };

    return NextResponse.json({
      enterprise,
      users,
      pendingInvitations,
      subscriptions,
      stats,
      currentUserRole: role ?? null,
      isAdmin,
    });
  } catch (error: any) {
    console.error("Erreur GET /api/enterprise/dashboard:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
