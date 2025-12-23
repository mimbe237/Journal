import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

/**
 * GET /api/reading-sessions
 * Récupère l'historique de lecture de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeStats = searchParams.get('stats') === 'true';

    const readingProgress = await prisma.readingProgress.findMany({
      where: { userId: user.id },
      include: {
        edition: {
          select: {
            id: true,
            titre: true,
            datePublication: true,
            type: true,
            cheminImageUne: true,
            nombrePages: true
          }
        }
      },
      orderBy: { lastReadAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.readingProgress.count({ where: { userId: user.id } });

    let stats = null;
    if (includeStats) {
      const allProgress = await prisma.readingProgress.findMany({
        where: { userId: user.id },
        select: { pageNumber: true, lastReadAt: true }
      });

      const totalBooksRead = allProgress.length;
      const totalPagesRead = allProgress.reduce((acc, curr) => acc + curr.pageNumber, 0);

      // Simple streak calculation
      let streak = 0;
      if (allProgress.length > 0) {
        const dates = allProgress
          .map(p => new Date(p.lastReadAt).toDateString())
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        const uniqueDates = Array.from(new Set(dates));
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
          streak = 1;
          let currentDate = new Date(uniqueDates[0]);
          for (let i = 1; i < uniqueDates.length; i++) {
            const prevDate = new Date(uniqueDates[i]);
            const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays === 1) {
              streak++;
              currentDate = prevDate;
            } else {
              break;
            }
          }
        }
      }

      stats = { totalBooksRead, totalPagesRead, readingStreak: streak };
    }

    return NextResponse.json({
      data: readingProgress.map(rp => ({
        id: rp.id,
        editionId: rp.editionId,
        editionTitle: rp.edition.titre,
        editionDate: rp.edition.datePublication,
        editionType: rp.edition.type,
        coverImage: rp.edition.cheminImageUne,
        currentPage: rp.pageNumber,
        totalPages: rp.totalPages,
        percentage: rp.percentage,
        lastReadAt: rp.lastReadAt
      })),
      total,
      hasMore: offset + limit < total,
      stats
    });
  } catch (error) {
    console.error('Erreur reading-sessions GET:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'historique' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reading-sessions
 * Met à jour la progression de lecture
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { editionId, pageNumber, totalPages } = await request.json();

    if (!editionId || typeof pageNumber !== 'number' || typeof totalPages !== 'number') {
      return NextResponse.json(
        { error: 'editionId, pageNumber et totalPages sont requis' },
        { status: 400 }
      );
    }

    const percentage = totalPages > 0 ? (pageNumber / totalPages) * 100 : 0;

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_editionId: {
          userId: user.id,
          editionId
        }
      },
      update: {
        pageNumber,
        totalPages,
        percentage,
        lastReadAt: new Date()
      },
      create: {
        userId: user.id,
        editionId,
        pageNumber,
        totalPages,
        percentage
      }
    });

    return NextResponse.json({
      success: true,
      progress: {
        id: progress.id,
        pageNumber: progress.pageNumber,
        totalPages: progress.totalPages,
        percentage: progress.percentage
      }
    });
  } catch (error) {
    console.error('Erreur reading-sessions POST:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la progression' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reading-sessions
 * Supprime l'historique de lecture d'une édition
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { editionId } = await request.json();

    if (!editionId) {
      return NextResponse.json(
        { error: 'editionId est requis' },
        { status: 400 }
      );
    }

    await prisma.readingProgress.deleteMany({
      where: {
        userId: user.id,
        editionId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur reading-sessions DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
