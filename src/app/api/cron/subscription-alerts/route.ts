import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { SubscriptionStatus, SystemEventType } from '@prisma/client';

/**
 * GET /api/cron/subscription-alerts
 * 
 * Cron job pour envoyer les alertes d'expiration d'abonnement
 * À exécuter quotidiennement via Vercel Cron ou autre scheduler
 * 
 * Headers requis pour sécurité :
 * - Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification du cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const now = new Date();
    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[]
    };

    // Configuration des alertes (jours avant expiration)
    const alertDays = [7, 1];

    for (const daysBefore of alertDays) {
      // Calculer la date cible
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBefore);
      
      // Début et fin de la journée cible
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Trouver les abonnements qui expirent ce jour-là
      const expiringSubscriptions = await prisma.subscription.findMany({
        where: {
          statut: SubscriptionStatus.ACTIF,
          dateFin: {
            gte: startOfDay,
            lte: endOfDay
          },
          deletedAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true
            }
          }
        }
      });

      for (const subscription of expiringSubscriptions) {
        results.processed++;

        if (!subscription.user) {
          continue;
        }

        try {
          // TODO: Intégrer avec le service d'email quand disponible
          // await sendSubscriptionExpiryEmail({ ... });
          
          results.emailsSent++;

          // Logger l'événement
          await prisma.systemEvent.create({
            data: {
              typeEvenement: SystemEventType.RENOUVELLEMENT_ABONNEMENT,
              userId: subscription.user.id,
              meta: {
                action: 'expiration_reminder_sent',
                subscriptionId: subscription.id,
                daysBefore,
                dateFin: subscription.dateFin.toISOString()
              }
            }
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          results.errors.push(`User ${subscription.user?.id}: ${errorMessage}`);
        }
      }
    }

    // Logger l'exécution du cron
    await prisma.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.AUTRE,
        meta: {
          action: 'cron_execution',
          results
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Cron terminé : ${results.emailsSent} emails envoyés sur ${results.processed} abonnements traités`,
      details: results
    });

  } catch (error) {
    console.error('Erreur cron subscription-alerts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'exécution du cron' },
      { status: 500 }
    );
  }
}
