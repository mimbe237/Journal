import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { UserRole, SubscriptionStatus, PaymentStatus } from '@prisma/client';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions admin
    const allowedRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.FACTURATION,
      UserRole.SUPPORT,
    ];

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Fetch stats in parallel
    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      activeSubscriptions,
      subscriptionsThisMonth,
      subscriptionsLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      totalEditions,
      pendingPayments,
      enterprises,
    ] = await Promise.all([
      // Total users (excluding staff)
      prisma.user.count({
        where: {
          role: {
            in: [UserRole.ABONNE, UserRole.COMPTE_ENTREPRISE],
          },
          deletedAt: null,
        },
      }),
      // Users created this month (using dateCreation field)
      prisma.user.count({
        where: {
          dateCreation: { gte: startOfMonth },
          role: {
            in: [UserRole.ABONNE, UserRole.COMPTE_ENTREPRISE],
          },
          deletedAt: null,
        },
      }),
      // Users created last month
      prisma.user.count({
        where: {
          dateCreation: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
          role: {
            in: [UserRole.ABONNE, UserRole.COMPTE_ENTREPRISE],
          },
          deletedAt: null,
        },
      }),
      // Active subscriptions (using statut and dateFin)
      prisma.subscription.count({
        where: {
          statut: SubscriptionStatus.ACTIF,
          dateFin: { gte: now },
          deletedAt: null,
        },
      }),
      // Subscriptions created this month (using dateDebut as proxy)
      prisma.subscription.count({
        where: {
          dateDebut: { gte: startOfMonth },
          statut: SubscriptionStatus.ACTIF,
          deletedAt: null,
        },
      }),
      // Subscriptions created last month
      prisma.subscription.count({
        where: {
          dateDebut: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
          statut: SubscriptionStatus.ACTIF,
          deletedAt: null,
        },
      }),
      // Revenue this month (using PaymentTransaction with createdAt)
      prisma.paymentTransaction.aggregate({
        _sum: { montant: true },
        where: {
          statut: PaymentStatus.SUCCES,
          createdAt: { gte: startOfMonth },
        },
      }),
      // Revenue last month
      prisma.paymentTransaction.aggregate({
        _sum: { montant: true },
        where: {
          statut: PaymentStatus.SUCCES,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),
      // Total editions
      prisma.edition.count(),
      // Pending payments
      prisma.paymentTransaction.count({
        where: { statut: PaymentStatus.EN_ATTENTE },
      }),
      // Enterprise accounts (using actif field)
      prisma.enterpriseAccount.count({
        where: { actif: true },
      }),
    ]);

    // Calculate trends
    const usersTrend = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0;

    const subscriptionsTrend = subscriptionsLastMonth > 0
      ? Math.round(((subscriptionsThisMonth - subscriptionsLastMonth) / subscriptionsLastMonth) * 100)
      : subscriptionsThisMonth > 0 ? 100 : 0;

    const currentRevenue = Number(revenueThisMonth?._sum?.montant || 0);
    const lastRevenue = Number(revenueLastMonth?._sum?.montant || 0);
    const revenueTrend = lastRevenue > 0
      ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
      : currentRevenue > 0 ? 100 : 0;

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      monthlyRevenue: currentRevenue,
      totalEditions,
      pendingPayments,
      enterprises,
      trends: {
        users: usersTrend,
        subscriptions: subscriptionsTrend,
        revenue: revenueTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
