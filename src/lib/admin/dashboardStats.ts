import { prisma } from "@/lib/config/prisma";

export type DashboardStats = {
  users: {
    total: number;
    newToday: number;
    newWeek: number;
    newMonth: number;
    activeSessions: number;
  };
  subscriptions: {
    total: number;
    active: number;
    byType: Record<string, number>;
    expiringSoon7: number;
    expiringSoon30: number;
  };
  revenue: {
    currentMonth: number;
    lastMonth: number;
  };
  editions: {
    total: number;
    latest: { titre: string; datePublication: Date } | null;
    mostRead: { titre?: string; sessions: number } | null;
    avgCompletion: number;
  };
  promoCodes: {
    active: number;
    totalUsage: number;
  };
  recent: {
    users: Array<{
      id: string;
      nom: string | null;
      email: string;
      dateCreation: Date;
      subscriptions: Array<{ type: string }>;
    }>;
    sessions: Array<{
      id: string;
      dateHeureDebut: Date;
      pageFin: number | null;
      edition: { titre: string | null; nombrePages: number | null } | null;
      user: { nom: string | null } | null;
    }>;
    activity: Array<{
      id: string;
      type: string;
      dateDebut: Date;
      user: { nom: string | null; email: string | null } | null;
    }>;
  };
};

export async function loadAdminDashboardStats(now = new Date()): Promise<DashboardStats> {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const next7Days = new Date(now);
  next7Days.setDate(now.getDate() + 7);
  const next30Days = new Date(now);
  next30Days.setDate(now.getDate() + 30);

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

  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  const activeSessions = await prisma.readingSession.count({
    where: { dateHeureDebut: { gte: thirtyMinutesAgo } }
  });

  const totalSubscriptions = await prisma.subscription.count();
  const activeSubscriptions = await prisma.subscription.count({
    where: {
      statut: "ACTIF",
      dateFin: { gte: now }
    }
  });

  const subscriptionsByTypeRaw = await prisma.subscription.groupBy({
    by: ["type"],
    where: {
      statut: "ACTIF",
      dateFin: { gte: now }
    },
    _count: true
  });

  const allSubscriptionsByType = subscriptionsByTypeRaw.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = item._count;
    return acc;
  }, {});

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

  const totalEditions = await prisma.edition.count();
  const latestEdition = await prisma.edition.findFirst({
    orderBy: { datePublication: "desc" },
    select: { titre: true, datePublication: true }
  });

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

  const activePromoCodes = await prisma.promoCode.count({
    where: {
      actif: true,
      dateFin: { gte: now }
    }
  });

  const promoUsage = await prisma.subscription.count({
    where: { promoCodeId: { not: null } }
  });

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

  return {
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
      byType: allSubscriptionsByType,
      expiringSoon7,
      expiringSoon30
    },
    revenue: {
      currentMonth: Number(currentMonthRevenue._sum.montant) || 0,
      lastMonth: Number(lastMonthRevenue._sum.montant) || 0
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
  };
}
