import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const submissions = await prisma.manualSubscriptionSubmission.findMany({
      where: {
        email: user.email
      },
      orderBy: {
        soumisA: 'desc'
      },
      include: {
        justificatifs: true
      }
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
