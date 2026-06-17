import { SubscriptionStatus, UserRole } from "@prisma/client";
import { startOfDay } from "date-fns";

import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";

type AccessStatus = "read" | "buy_or_subscribe" | "subscribe";

export type EditionAccess = {
  status: AccessStatus;
  detail?: string;
  coverage?: {
    type: "individual" | "enterprise";
    dateDebut: Date;
    dateFin: Date;
  };
};

/**
 * Vérifie si un plan d'abonnement couvre un type de journal spécifique.
 */
async function planCoversJournalType(planId: string | null, journalTypeId: string | null): Promise<boolean> {
  // Si pas de plan ou pas de journalType, on considère que c'est couvert (rétrocompatibilité)
  if (!planId || !journalTypeId) return true;
  
  const link = await prisma.subscriptionPlanJournalType.findFirst({
    where: { planId, journalTypeId }
  });
  return !!link;
}

export async function getEditionAccessForUser(params: {
  userId: string;
  editionDate: Date;
  journalTypeId?: string | null;
}): Promise<EditionAccess> {
  await prismaRuntimeReady;

  const editionDate = startOfDay(new Date(params.editionDate));
  const journalTypeId = params.journalTypeId || null;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, role: true, enterpriseAccountId: true }
  });

  if (!user) {
    return { status: "subscribe", detail: "Utilisateur introuvable" };
  }

  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SUPPORT) {
    return { status: "read", detail: "Accès illimité (administration)" };
  }

  const orFilters: any[] = [{ userId: user.id }];
  if (user.enterpriseAccountId) {
    orFilters.push({ enterpriseAccountId: user.enterpriseAccountId });
  }

  // Rechercher un abonnement couvrant la date ET le type de journal
  const coveringSubs = await prisma.subscription.findMany({
    where: {
      statut: SubscriptionStatus.ACTIF,
      dateDebut: { lte: editionDate },
      dateFin: { gte: editionDate },
      OR: orFilters
    },
    orderBy: { dateFin: "desc" },
    include: { plan: true }
  });

  // Vérifier si un des abonnements couvre le type de journal
  for (const sub of coveringSubs) {
    const covers = await planCoversJournalType(sub.planId, journalTypeId);
    if (covers) {
      return {
        status: "read",
        detail: "Inclus dans votre abonnement",
        coverage: {
          type: sub.enterpriseAccountId ? "enterprise" : "individual",
          dateDebut: sub.dateDebut,
          dateFin: sub.dateFin
        }
      };
    }
  }

  // Vérifier s'il y a un abonnement actif qui ne couvre pas cette édition
  const activeSubs = await prisma.subscription.findMany({
    where: {
      statut: SubscriptionStatus.ACTIF,
      dateFin: { gte: new Date() },
      OR: orFilters
    },
    orderBy: { dateFin: "desc" },
    include: { plan: true }
  });

  if (activeSubs.length > 0) {
    const firstActive = activeSubs[0];
    return {
      status: "buy_or_subscribe",
      detail: "Votre abonnement actif ne couvre pas cette édition",
      coverage: {
        type: firstActive.enterpriseAccountId ? "enterprise" : "individual",
        dateDebut: firstActive.dateDebut,
        dateFin: firstActive.dateFin
      }
    };
  }

  return {
    status: "subscribe",
    detail: "Aucun abonnement actif"
  };
}
