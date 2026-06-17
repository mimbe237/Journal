import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const q = query.trim();
    const qLower = q.toLowerCase();

    // Recherche dans les titres/tags (DB), puis filtrage des headlines en mémoire
    const editions = await prisma.edition.findMany({
      where: {
        OR: [
          { titre: { contains: q, mode: 'insensitive' } },
          { tags: { hasSome: [q] } },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        titre: true,
        datePublication: true,
        cheminImageUne: true,
        headlines: true,
        tags: true,
        journalType: {
          select: { id: true, name: true },
        },
      },
      orderBy: { datePublication: 'desc' },
      take: 15,
    });

    const results = editions
      .map((ed) => {
        const headlines = (ed.headlines as { title?: string; page?: number }[] | null) || [];
        const matchedHeadlines = headlines.filter(
          (h) => h.title && h.title.toLowerCase().includes(qLower)
        );

        const matched =
          ed.titre.toLowerCase().includes(qLower) ||
          (ed.tags || []).some((t) => t.toLowerCase().includes(qLower)) ||
          matchedHeadlines.length > 0;

        if (!matched) return null;

        return {
          id: ed.id,
          titre: ed.titre,
          datePublication: ed.datePublication,
          cheminImageUne: ed.cheminImageUne,
          journalType: ed.journalType,
          tags: ed.tags || [],
          matchedHeadlines: matchedHeadlines.slice(0, 5),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
  }
}
