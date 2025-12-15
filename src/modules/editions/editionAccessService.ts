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

export async function getEditionAccessForUser(params: {
  userId: string;
  editionDate: Date;
}): Promise<EditionAccess> {
  await prismaRuntimeReady;

  const editionDate = startOfDay(new Date(params.editionDate));

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

  const coveringSub = await prisma.subscription.findFirst({
    where: {
      statut: SubscriptionStatus.ACTIF,
      dateDebut: { lte: editionDate },
      dateFin: { gte: editionDate },
      OR: orFilters
    },
    orderBy: { dateFin: "desc" }
  });

  if (coveringSub) {
    return {
      status: "read",
      detail: "Inclus dans votre abonnement",
      coverage: {
        type: coveringSub.enterpriseAccountId ? "enterprise" : "individual",
        dateDebut: coveringSub.dateDebut,
        dateFin: coveringSub.dateFin
      }
    };
  }

  const activeSub = await prisma.subscription.findFirst({
    where: {
      statut: SubscriptionStatus.ACTIF,
      dateFin: { gte: new Date() },
      OR: orFilters
    },
    orderBy: { dateFin: "desc" }
  });

  if (activeSub) {
    return {
      status: "buy_or_subscribe",
      detail: "Votre abonnement actif ne couvre pas cette édition",
      coverage: {
        type: activeSub.enterpriseAccountId ? "enterprise" : "individual",
        dateDebut: activeSub.dateDebut,
        dateFin: activeSub.dateFin
      }
    };
  }

  return {
    status: "subscribe",
    detail: "Aucun abonnement actif"
  };
}
