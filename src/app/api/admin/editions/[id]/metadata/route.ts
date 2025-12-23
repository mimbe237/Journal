import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user || !['SUPER_ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { headlines, tags } = body;

    const updatedEdition = await prisma.edition.update({
      where: { id },
      data: {
        headlines: headlines ?? undefined,
        tags: tags ?? undefined,
      },
    });

    return NextResponse.json(updatedEdition);
  } catch (error) {
    console.error('Error updating edition metadata:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
