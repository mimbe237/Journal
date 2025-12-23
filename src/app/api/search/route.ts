import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Recherche dans les titres, tags et headlines
    const editions = await prisma.edition.findMany({
      where: {
        OR: [
          { titre: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }, // Recherche exacte dans les tags (limité)
          // Note: Pour une recherche JSON profonde ou floue sur les tags, 
          // PostgreSQL Full Text Search serait mieux, mais on reste simple ici.
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
      },
      orderBy: { datePublication: 'desc' },
      take: 10,
    });

    // Post-processing pour filtrer/enrichir si besoin
    // (Ex: si on veut chercher DANS le JSON headlines manuellement si Prisma ne le fait pas bien)
    
    return NextResponse.json({ results: editions });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Erreur de recherche' }, { status: 500 });
  }
}
