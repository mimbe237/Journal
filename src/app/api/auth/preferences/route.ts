import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';

/**
 * GET /api/auth/preferences
 * Récupère les préférences de notification de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const notificationPrefs = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id }
    });

    // Retourner les valeurs par défaut si pas encore créées
    const preferences = notificationPrefs || {
      newEditions: true,
      expirationAlerts: true,
      newsletter: false,
      summaryFrequency: 'weekly'
    };

    return NextResponse.json({
      preferences: {
        newEditions: preferences.newEditions,
        expirationAlerts: preferences.expirationAlerts,
        newsletter: preferences.newsletter,
        summaryFrequency: preferences.summaryFrequency
      }
    });
  } catch (error) {
    console.error('Erreur preferences GET:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des préférences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/preferences
 * Met à jour les préférences de notification
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { newEditions, expirationAlerts, newsletter, summaryFrequency } = await request.json();

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      update: {
        ...(typeof newEditions === 'boolean' ? { newEditions } : {}),
        ...(typeof expirationAlerts === 'boolean' ? { expirationAlerts } : {}),
        ...(typeof newsletter === 'boolean' ? { newsletter } : {}),
        ...(typeof summaryFrequency === 'string' ? { summaryFrequency } : {})
      },
      create: {
        userId: user.id,
        newEditions: newEditions ?? true,
        expirationAlerts: expirationAlerts ?? true,
        newsletter: newsletter ?? false,
        summaryFrequency: summaryFrequency ?? 'weekly'
      }
    });

    return NextResponse.json({
      success: true,
      preferences: {
        newEditions: preferences.newEditions,
        expirationAlerts: preferences.expirationAlerts,
        newsletter: preferences.newsletter,
        summaryFrequency: preferences.summaryFrequency
      }
    });
  } catch (error) {
    console.error('Erreur preferences PUT:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    );
  }
}
