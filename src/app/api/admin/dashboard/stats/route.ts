import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";

/**
 * GET /api/admin/dashboard/stats
 * Retourne les statistiques globales pour le tableau de bord admin
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.FACTURATION,
      UserRole.SUPPORT
    ]);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);
    const next30Days = new Date(now);
    next30Days.setDate(now.getDate() + 30);

    // Utilisateurs
    const totalUsers = await prisma.user.count();
    const newUsersToday = await prisma.user.count({
      where: { dateCreation: { gte: startOfToday } }
    });
    const newUsersWeek = await prisma.user.count({
      where: { dateCreation: { gte: startOfWeek } }
    });
    const newUsersMonth = await prisma.user.count({
      where: { dateCreation: { gte: startOfMonth } }
    });

    // Sessions de lecture actives (dernières 30 minutes)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const activeSessions = await prisma.readingSession.count({
      where: { dateHeureDebut: { gte: thirtyMinutesAgo } }
    });

    // Abonnements
    const totalSubscriptions = await prisma.subscription.count();
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        statut: "ACTIF",
        dateFin: { gte: now }
      }
    });

    // Abonnements par type
    const subscriptionsByType = await prisma.subscription.groupBy({
      by: ["type"],
      where: {
        statut: "ACTIF",
        dateFin: { gte: now }
      },
      _count: true
    });

    // Abonnements expirant bientôt
    const expiringSoon7 = await prisma.subscription.count({
      where: {
        statut: "ACTIF",
        dateFin: { gte: now, lte: next7Days }
      }
    });
    const expiringSoon30 = await prisma.subscription.count({
      where: {
        statut: "ACTIF",
        dateFin: { gte: now, lte: next30Days }
      }
    });

    // Revenus (somme des prix des abonnements actifs)
    const currentMonthRevenue = await prisma.subscription.aggregate({
      where: {
        dateDebut: { gte: startOfMonth },
        statut: "ACTIF"
      },
      _sum: { montant: true }
    });

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthRevenue = await prisma.subscription.aggregate({
      where: {
        dateDebut: { gte: lastMonthStart, lte: lastMonthEnd },
        statut: "ACTIF"
      },
      _sum: { montant: true }
    });

    // Éditions
    const totalEditions = await prisma.edition.count();
    const latestEdition = await prisma.edition.findFirst({
      orderBy: { datePublication: "desc" },
      select: { titre: true, datePublication: true }
    });

    // Sessions de lecture par édition (édition la plus lue)
    const sessionsByEdition = await prisma.readingSession.groupBy({
      by: ["editionId"],
      _count: true,
      orderBy: { _count: { editionId: "desc" } },
      take: 1
    });

    let mostReadEdition = null;
    if (sessionsByEdition.length > 0) {
      const editionId = sessionsByEdition[0].editionId;
      const edition = await prisma.edition.findUnique({
        where: { id: editionId },
        select: { titre: true }
      });
      mostReadEdition = {
        titre: edition?.titre,
        sessions: sessionsByEdition[0]._count
      };
    }

    // Taux de complétion moyen
    const sessions = await prisma.readingSession.findMany({
      select: { pageFin: true, edition: { select: { nombrePages: true } } }
    });
    let avgCompletion = 0;
    if (sessions.length > 0) {
      const total = sessions.reduce((sum, s) => {
        const pages = s.edition?.nombrePages || 1;
        return sum + ((s.pageFin || 0) / pages);
      }, 0);
      avgCompletion = Math.round((total / sessions.length) * 100);
    }

    // Codes promo
    const activePromoCodes = await prisma.promoCode.count({
      where: {
        actif: true,
        dateFin: { gte: now }
      }
    });

    const promoUsage = await prisma.subscription.count({
      where: { promoCodeId: { not: null } }
    });

    // Derniers utilisateurs
    const recentUsers = await prisma.user.findMany({
      orderBy: { dateCreation: "desc" },
      take: 5,
      select: {
        id: true,
        nom: true,
        email: true,
        dateCreation: true,
        subscriptions: {
          where: { statut: "ACTIF", dateFin: { gte: now } },
          take: 1,
          select: { type: true }
        }
      }
    });

    // Dernières sessions
    const recentSessions = await prisma.readingSession.findMany({
      orderBy: { dateHeureDebut: "desc" },
      take: 5,
      select: {
        id: true,
        dateHeureDebut: true,
        pageFin: true,
        user: { select: { nom: true } },
        edition: { select: { titre: true, nombrePages: true } }
      }
    });

    // Activité récente (derniers abonnements créés)
    const recentActivity = await prisma.subscription.findMany({
      orderBy: { dateDebut: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        dateDebut: true,
        user: { select: { nom: true, email: true } }
      }
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newWeek: newUsersWeek,
        newMonth: newUsersMonth,
        activeSessions
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        byType: subscriptionsByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
        expiringSoon7,
        expiringSoon30
      },
      revenue: {
        currentMonth: currentMonthRevenue._sum.montant || 0,
        lastMonth: lastMonthRevenue._sum.montant || 0
      },
      editions: {
        total: totalEditions,
        latest: latestEdition,
        mostRead: mostReadEdition,
        avgCompletion
      },
      promoCodes: {
        active: activePromoCodes,
        totalUsage: promoUsage
      },
      recent: {
        users: recentUsers,
        sessions: recentSessions,
        activity: recentActivity
      }
    });
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    // Log l'erreur complète pour déboguer
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
