import { prisma } from "@/lib/config/prisma";
import { findSubscriptionsExpiringIn } from "@/modules/subscriptions/subscriptionService";
import { sendSubscriptionExpiryEmail, sendSubscriptionExpirySms } from "@/modules/notifications/notificationService";
import { logEvent } from "@/modules/logs/loggingService";

const DAYS_BEFORE = [30, 7, 1];

/**
 * Traite les rappels d'expiration (J-30/J-7/J-1) pour les abonnements actifs.
 * Hypothèse simple : le cron tourne 1x/jour, on cible l'expiration exacte (dateFin == now + daysBefore).
 * TODO: ajouter une table de suivi (SubscriptionReminder) pour éviter les doublons si le cron tourne plusieurs fois/jour.
 */
export async function processSubscriptionExpiryReminders(dateReference: Date): Promise<void> {
  const stats: Record<number, number> = {};

  for (const days of DAYS_BEFORE) {
    const expiring = await findSubscriptionsExpiringIn(days, dateReference);
    stats[days] = expiring.length;

    for (const sub of expiring) {
      try {
        // On privilégie l'email de l'utilisateur ; pour B2B, on utilise le contactEmail de l'entreprise.
        if (sub.userId) {
          const user = await prisma.user.findUnique({ where: { id: sub.userId } });
          if (user?.email) {
            await sendSubscriptionExpiryEmail({
              userEmail: user.email,
              userName: user.nom,
              daysBefore: days,
              dateFin: sub.dateFin
            });
          }
          // TODO: envoyer un SMS si un numéro existe (champ à ajouter dans User).
        } else if (sub.enterpriseAccountId) {
          const enterprise = await prisma.enterpriseAccount.findUnique({
            where: { id: sub.enterpriseAccountId }
          });
          if (enterprise?.contactEmail) {
            await sendSubscriptionExpiryEmail({
              userEmail: enterprise.contactEmail,
              userName: enterprise.nom,
              daysBefore: days,
              dateFin: sub.dateFin
            });
          }
          if (enterprise?.contactTelephone) {
            // Optionnel : SMS pour le contact entreprise.
            await sendSubscriptionExpirySms({
              phoneNumber: enterprise.contactTelephone,
              daysBefore: days,
              dateFin: sub.dateFin
            }).catch(() => {});
          }
        }

        await logEvent({
          type: "RAPPEL_EXPIRATION_ABONNEMENT",
          userId: sub.userId ?? null,
          meta: {
            subscriptionId: sub.id,
            enterpriseAccountId: sub.enterpriseAccountId ?? null,
            daysBefore: days,
            dateFin: sub.dateFin.toISOString()
          }
        });
      } catch (err: any) {
        // On loggue mais on continue le batch.
        await logEvent({
          type: "AUTRE",
          meta: {
            context: "rappel_expiration_error",
            subscriptionId: sub.id,
            daysBefore: days,
            error: err?.message
          }
        }).catch(() => {});
      }
    }
  }

  await logEvent({
    type: "EXECUTION_RAPPELS_EXPIRATION",
    meta: {
      dateReference: dateReference.toISOString(),
      totals: stats,
      hypothesis: "cron_daily_exact_dates" // Documente l'hypothèse de déduplication simple.
    }
  });
}
