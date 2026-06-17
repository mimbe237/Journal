import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { UserRole } from '@prisma/client';

/**
 * GET /api/enterprise/reports
 * Génère des rapports pour le compte entreprise
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin d'une entreprise
    if (user.role !== UserRole.COMPTE_ENTREPRISE && !user.enterpriseAccountId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const enterprise = await prisma.enterpriseAccount.findFirst({
      where: {
        OR: [
          { adminPrimaireId: user.id },
          { id: user.enterpriseAccountId || '' }
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            nom: true,
            email: true,
            dateCreation: true,
            dernierLoginAt: true
          }
        },
        subscriptions: {
          select: {
            id: true,
            type: true,
            statut: true,
            dateDebut: true,
            dateFin: true
          }
        }
      }
    });

    if (!enterprise) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Stats de base
    const totalUsers = enterprise.users.length;
    const activeUsers = enterprise.users.filter(u => u.dernierLoginAt).length;

    // Récupérer les progressions de lecture des utilisateurs
    const userIds = enterprise.users.map((u: { id: string }) => u.id);
    
    const readingProgress = await prisma.readingProgress.findMany({
      where: {
        userId: { in: userIds }
      },
      include: {
        edition: {
          select: {
            id: true,
            titre: true
          }
        }
      },
      orderBy: { lastReadAt: 'desc' },
      take: 100
    });

    // Calculer les statistiques
    const activeUserIds = new Set(readingProgress.map((rp: { userId: string }) => rp.userId));
    const usersWithReading = activeUserIds.size;

    // Éditions les plus lues
    const editionReadCounts: Record<string, { title: string; count: number }> = {};
    readingProgress.forEach((rp: { edition: { id: string; titre: string } }) => {
      if (!editionReadCounts[rp.edition.id]) {
        editionReadCounts[rp.edition.id] = { title: rp.edition.titre, count: 0 };
      }
      editionReadCounts[rp.edition.id].count++;
    });

    const topEditions = Object.entries(editionReadCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      enterprise: {
        id: enterprise.id,
        nom: enterprise.nom,
        contactEmail: enterprise.contactEmail
      },
      stats: {
        totalUsers,
        activeUsers,
        usersWithReading,
        totalSubscriptions: enterprise.subscriptions.length,
        activeSubscriptions: enterprise.subscriptions.filter(s => s.statut === 'ACTIF').length
      },
      topEditions,
      recentActivity: readingProgress.slice(0, 10).map((rp: { 
        userId: string; 
        edition: { titre: string }; 
        lastReadAt: Date; 
        percentage: number 
      }) => ({
        userId: rp.userId,
        editionTitle: rp.edition.titre,
        lastReadAt: rp.lastReadAt,
        percentage: rp.percentage
      }))
    });
  } catch (error) {
    console.error('Erreur enterprise/reports:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    );
  }
}
