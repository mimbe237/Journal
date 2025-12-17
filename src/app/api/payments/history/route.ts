import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

/**
 * GET /api/payments/history
 * Récupère l'historique des paiements de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const where = { userId: user.id };

    const [total, payments] = await Promise.all([
      prisma.paymentTransaction.count({ where }),
      prisma.paymentTransaction.findMany({
        where,
        select: {
          id: true,
          montant: true,
          devise: true,
          statut: true,
          referenceExterne: true,
          createdAt: true,
          subscription: {
            select: {
              type: true,
              dateDebut: true,
              dateFin: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      })
    ]);

    return NextResponse.json({
      payments: payments.map(p => ({
        id: p.id,
        amount: Number(p.montant),
        currency: p.devise,
        status: p.statut,
        reference: p.referenceExterne,
        date: p.createdAt,
        subscription: p.subscription ? {
          type: p.subscription.type,
          startDate: p.subscription.dateDebut,
          endDate: p.subscription.dateFin
        } : null
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur payments/history:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des paiements' },
      { status: 500 }
    );
  }
}
