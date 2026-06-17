import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { UserRole } from '@prisma/client';

interface SearchResult {
  id: string;
  name: string;
  email: string;
  role: string;
  type: 'user' | 'enterprise' | 'subscription';
  status?: string;
}

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim();
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: SearchResult[] = [];

    // Search users (using nom field from schema)
    if (type === 'all' || type === 'user') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { nom: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          nom: true,
          email: true,
          role: true,
        },
        take: limit,
      });

      results.push(
        ...users.map((u) => ({
          id: u.id,
          name: u.nom,
          email: u.email,
          role: u.role,
          type: 'user' as const,
        }))
      );
    }

    // Search enterprises (using contactEmail and nom)
    if (type === 'all' || type === 'enterprise') {
      const enterprises = await prisma.enterpriseAccount.findMany({
        where: {
          OR: [
            { nom: { contains: query, mode: 'insensitive' } },
            { contactEmail: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          nom: true,
          contactEmail: true,
          actif: true,
        },
        take: limit,
      });

      results.push(
        ...enterprises.map((e) => ({
          id: e.id,
          name: e.nom,
          email: e.contactEmail || '',
          role: 'Entreprise',
          type: 'enterprise' as const,
          status: e.actif ? 'Actif' : 'Inactif',
        }))
      );
    }

    // Search subscriptions (using user nom and subscription id)
    if (type === 'all' || type === 'subscription') {
      const subscriptions = await prisma.subscription.findMany({
        where: {
          OR: [
            { id: { contains: query, mode: 'insensitive' } },
            { user: { nom: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          statut: true,
          type: true,
          user: {
            select: {
              nom: true,
              email: true,
            },
          },
        },
        take: limit,
      });

      results.push(
        ...subscriptions.map((s) => ({
          id: s.id,
          name: s.user?.nom || 'Abonnement Entreprise',
          email: s.user?.email || '',
          role: s.type,
          type: 'subscription' as const,
          status: s.statut,
        }))
      );
    }

    return NextResponse.json({ results: results.slice(0, limit) });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
