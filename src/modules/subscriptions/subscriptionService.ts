import {
  Prisma,
  Subscription,
  SubscriptionStatus,
  SubscriptionType,
  SubscriptionSource,
  SystemEventType
} from "@prisma/client";
import { addDays, startOfDay, endOfDay } from "date-fns";

import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import {
  calculateDiscountedAmount,
  incrementPromoCodeUsage,
  validatePromoCode
} from "@/modules/promocodes/promoCodeService";

// Helpers internes
function assertDates(dateDebut: Date, dateFin: Date) {
  if (!(dateDebut instanceof Date) || !(dateFin instanceof Date) || isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
    throw new Error("Dates invalides");
  }
  if (dateDebut >= dateFin) {
    throw new Error("dateDebut doit être antérieure à dateFin");
  }
}

// --- Services d'abonnement ---

/**
 * Retourne l'abonnement ACTIF le plus récent pour un utilisateur.
 */
export async function getActiveSubscriptionForUser(userId: string): Promise<Subscription | null> {
  await prismaRuntimeReady;
  const now = new Date();
  return prisma.subscription.findFirst({
    where: { userId, statut: SubscriptionStatus.ACTIF, dateFin: { gte: now } },
    orderBy: { dateFin: "desc" }
  });
}

/**
 * Retourne l'abonnement ACTIF le plus récent pour un compte entreprise.
 */
export async function getActiveSubscriptionForEnterprise(
  enterpriseAccountId: string
): Promise<Subscription | null> {
  await prismaRuntimeReady;
  const now = new Date();
  return prisma.subscription.findFirst({
    where: { enterpriseAccountId, statut: SubscriptionStatus.ACTIF, dateFin: { gte: now } },
    orderBy: { dateFin: "desc" }
  });
}

/**
 * Crée un abonnement pour un utilisateur (B2C).
 */
export async function createSubscriptionForUser(params: {
  userId: string;
  type: SubscriptionType;
  dateDebut: Date;
  dateFin: Date;
  montant: number;
  devise: string;
  source: SubscriptionSource;
  promoCodeId?: string;
}): Promise<Subscription> {
  await prismaRuntimeReady;
  assertDates(params.dateDebut, params.dateFin);

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  const subscription = await prisma.$transaction(async (tx) => {
    const created = await tx.subscription.create({
      data: {
        userId: params.userId,
        type: params.type,
        statut: SubscriptionStatus.ACTIF,
        dateDebut: params.dateDebut,
        dateFin: params.dateFin,
        montant: new Prisma.Decimal(params.montant),
        devise: params.devise,
        source: params.source,
        promoCodeId: params.promoCodeId
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.CREATION_ABONNEMENT,
        userId: params.userId,
        meta: {
          subscriptionId: created.id,
          type: params.type,
          source: params.source,
          promoCodeId: params.promoCodeId ?? null
        }
      }
    });

    return created;
  });

  return subscription;
}

/**
 * Crée un abonnement B2C en appliquant un code promo si fourni.
 */
export async function createSubscriptionWithPromoForUser(params: {
  userId: string;
  type: SubscriptionType;
  dateDebut: Date;
  dateFin: Date;
  montantInitial: number;
  devise: string;
  source: SubscriptionSource;
  promoCode?: string;
}): Promise<Subscription> {
  await prismaRuntimeReady;
  if (!params.promoCode) {
    return createSubscriptionForUser({
      userId: params.userId,
      type: params.type,
      dateDebut: params.dateDebut,
      dateFin: params.dateFin,
      montant: params.montantInitial,
      devise: params.devise,
      source: params.source
    });
  }

  // Validation du code promo
  const promo = await validatePromoCode({
    code: params.promoCode,
    dateUsage: params.dateDebut,
    userId: params.userId
  });

  const montantFinal = calculateDiscountedAmount({
    montantInitial: params.montantInitial,
    typeRemise: promo.typeRemise,
    valeurRemise: promo.valeurRemise.toNumber()
  });

  const subscription = await prisma.$transaction(async (tx) => {
    const created = await tx.subscription.create({
      data: {
        userId: params.userId,
        type: params.type,
        statut: SubscriptionStatus.ACTIF,
        dateDebut: params.dateDebut,
        dateFin: params.dateFin,
        montant: new Prisma.Decimal(montantFinal),
        devise: params.devise,
        source: params.source,
        promoCodeId: promo.id
      }
    });

    await incrementPromoCodeUsage(promo.id, tx);

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.UTILISATION_CODE_PROMO,
        userId: params.userId,
        meta: {
          subscriptionId: created.id,
          code: promo.code,
          montantInitial: params.montantInitial,
          montantFinal,
          promoCodeId: promo.id
        }
      }
    });

    return created;
  });

  return subscription;
}

/**
 * Crée un abonnement B2B (entreprise) en appliquant un code promo si fourni.
 */
export async function createSubscriptionWithPromoForEnterprise(params: {
  enterpriseAccountId: string;
  type: SubscriptionType;
  dateDebut: Date;
  dateFin: Date;
  montantInitial: number;
  devise: string;
  source: SubscriptionSource;
  promoCode?: string;
}): Promise<Subscription> {
  await prismaRuntimeReady;
  if (!params.promoCode) {
    return createSubscriptionForEnterprise({
      enterpriseAccountId: params.enterpriseAccountId,
      type: params.type,
      dateDebut: params.dateDebut,
      dateFin: params.dateFin,
      montant: params.montantInitial,
      devise: params.devise,
      source: params.source
    });
  }

  const promo = await validatePromoCode({
    code: params.promoCode,
    dateUsage: params.dateDebut,
    userId: null
  });

  const montantFinal = calculateDiscountedAmount({
    montantInitial: params.montantInitial,
    typeRemise: promo.typeRemise,
    valeurRemise: promo.valeurRemise.toNumber()
  });

  const subscription = await prisma.$transaction(async (tx) => {
    const created = await tx.subscription.create({
      data: {
        enterpriseAccountId: params.enterpriseAccountId,
        type: params.type,
        statut: SubscriptionStatus.ACTIF,
        dateDebut: params.dateDebut,
        dateFin: params.dateFin,
        montant: new Prisma.Decimal(montantFinal),
        devise: params.devise,
        source: params.source,
        promoCodeId: promo.id
      }
    });

    await incrementPromoCodeUsage(promo.id, tx);

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.UTILISATION_CODE_PROMO,
        userId: null,
        meta: {
          subscriptionId: created.id,
          code: promo.code,
          montantInitial: params.montantInitial,
          montantFinal,
          promoCodeId: promo.id,
          enterpriseAccountId: params.enterpriseAccountId
        }
      }
    });

    return created;
  });

  return subscription;
}
/**
 * Crée un abonnement pour un compte entreprise (B2B).
 */
export async function createSubscriptionForEnterprise(params: {
  enterpriseAccountId: string;
  type: SubscriptionType;
  dateDebut: Date;
  dateFin: Date;
  montant: number;
  devise: string;
  source: SubscriptionSource;
  promoCodeId?: string;
}): Promise<Subscription> {
  await prismaRuntimeReady;
  assertDates(params.dateDebut, params.dateFin);

  const enterprise = await prisma.enterpriseAccount.findUnique({ where: { id: params.enterpriseAccountId } });
  if (!enterprise) {
    throw new Error("Compte entreprise introuvable");
  }

  const subscription = await prisma.$transaction(async (tx) => {
    const created = await tx.subscription.create({
      data: {
        enterpriseAccountId: params.enterpriseAccountId,
        type: params.type,
        statut: SubscriptionStatus.ACTIF,
        dateDebut: params.dateDebut,
        dateFin: params.dateFin,
        montant: new Prisma.Decimal(params.montant),
        devise: params.devise,
        source: params.source,
        promoCodeId: params.promoCodeId
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.CREATION_ABONNEMENT,
        userId: null,
        meta: {
          subscriptionId: created.id,
          enterpriseAccountId: params.enterpriseAccountId,
          type: params.type,
          source: params.source,
          promoCodeId: params.promoCodeId ?? null
        }
      }
    });

    return created;
  });

  return subscription;
}

/**
 * Renouvelle un abonnement (prolonge la date de fin, optionnellement met à jour montant/source).
 */
export async function renewSubscription(params: {
  subscriptionId: string;
  nouvelleDateFin: Date;
  montant?: number;
  source?: SubscriptionSource;
}): Promise<Subscription> {
  await prismaRuntimeReady;
  const subscription = await prisma.subscription.findUnique({ where: { id: params.subscriptionId } });
  if (!subscription) {
    throw new Error("Abonnement introuvable");
  }

  if (!(params.nouvelleDateFin instanceof Date) || isNaN(params.nouvelleDateFin.getTime())) {
    throw new Error("nouvelleDateFin invalide");
  }
  if (params.nouvelleDateFin <= subscription.dateFin) {
    throw new Error("La nouvelle date de fin doit être postérieure à l'actuelle");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.SubscriptionUpdateInput = {
      dateFin: params.nouvelleDateFin,
      statut: SubscriptionStatus.ACTIF
    };
    if (typeof params.montant === "number") {
      data.montant = new Prisma.Decimal(params.montant);
    }
    if (params.source) {
      data.source = params.source;
    }

    const result = await tx.subscription.update({
      where: { id: params.subscriptionId },
      data
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.RENOUVELLEMENT_ABONNEMENT,
        userId: subscription.userId,
        meta: {
          subscriptionId: subscription.id,
          ancienneDateFin: subscription.dateFin,
          nouvelleDateFin: params.nouvelleDateFin,
          montantMisAJour: params.montant ?? null,
          sourceMiseAJour: params.source ?? null
        }
      }
    });

    return result;
  });

  return updated;
}

/**
 * Ajuste la date de fin d'un abonnement (geste commercial, correction). Réservé admin.
 */
export async function adjustSubscriptionEndDate(params: {
  subscriptionId: string;
  nouvelleDateFin: Date;
  raison: string;
  adminId: string;
}): Promise<Subscription> {
  await prismaRuntimeReady;
  const subscription = await prisma.subscription.findUnique({ where: { id: params.subscriptionId } });
  if (!subscription) {
    throw new Error("Abonnement introuvable");
  }

  if (!(params.nouvelleDateFin instanceof Date) || isNaN(params.nouvelleDateFin.getTime())) {
    throw new Error("nouvelleDateFin invalide");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.subscription.update({
      where: { id: params.subscriptionId },
      data: { dateFin: params.nouvelleDateFin }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.AJUSTEMENT_ABONNEMENT,
        userId: subscription.userId,
        meta: {
          subscriptionId: subscription.id,
          ancienneDateFin: subscription.dateFin,
          nouvelleDateFin: params.nouvelleDateFin,
          raison: params.raison,
          adminId: params.adminId,
          enterpriseAccountId: subscription.enterpriseAccountId ?? null
        }
      }
    });

    return result;
  });

  return updated;
}

/**
 * Annule ou marque un remboursement d'abonnement. Met à jour le statut.
 */
export async function cancelOrRefundSubscription(params: {
  subscriptionId: string;
  adminId: string;
  raison: string;
  typeOperation: "ANNULATION" | "REMBOURSEMENT_PARTIEL" | "REMBOURSEMENT_TOTAL";
}): Promise<Subscription> {
  await prismaRuntimeReady;
  const subscription = await prisma.subscription.findUnique({ where: { id: params.subscriptionId } });
  if (!subscription) {
    throw new Error("Abonnement introuvable");
  }

  const now = new Date();
  let nouveauStatut = subscription.statut;
  let nouvelleDateFin: Date | undefined;

  if (params.typeOperation === "REMBOURSEMENT_PARTIEL") {
    nouveauStatut = SubscriptionStatus.SUSPENDU;
  } else {
    nouveauStatut = SubscriptionStatus.EXPIRE;
    nouvelleDateFin = now;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.subscription.update({
      where: { id: params.subscriptionId },
      data: {
        statut: nouveauStatut,
        ...(nouvelleDateFin ? { dateFin: nouvelleDateFin } : {})
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement:
          params.typeOperation === "ANNULATION"
            ? SystemEventType.ANNULATION_ABONNEMENT
            : SystemEventType.REMBOURSEMENT,
        userId: subscription.userId,
        meta: {
          subscriptionId: subscription.id,
          typeOperation: params.typeOperation,
          raison: params.raison,
          adminId: params.adminId,
          ancienneDateFin: subscription.dateFin,
          nouvelleDateFin: result.dateFin,
          enterpriseAccountId: subscription.enterpriseAccountId ?? null
        }
      }
    });

    return result;
  });

  return updated;
}

/**
 * Vérifie si un utilisateur a un accès valide (abonnement individuel ou via son entreprise).
 */
export async function hasValidAccessToContent(params: {
  userId: string;
  enterpriseAccountId?: string;
}): Promise<boolean> {
  await prismaRuntimeReady;
  const now = new Date();

  const individual = await prisma.subscription.findFirst({
    where: {
      userId: params.userId,
      statut: SubscriptionStatus.ACTIF,
      dateFin: { gte: now }
    }
  });
  if (individual) return true;

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  const enterpriseId = params.enterpriseAccountId ?? user?.enterpriseAccountId;
  if (!enterpriseId) return false;

  const enterpriseSub = await prisma.subscription.findFirst({
    where: {
      enterpriseAccountId: enterpriseId,
      statut: SubscriptionStatus.ACTIF,
      dateFin: { gte: now }
    }
  });

  return Boolean(enterpriseSub);
}

/**
 * Liste les abonnements ACTIFS qui expirent dans X jours (fenêtre sur la journée).
 * TODO: utiliser cette fonction dans un service de notifications (emails/SMS J-30/J-7/J-1) et logguer l'envoi dans SystemEvent.
 */
export async function findSubscriptionsExpiringIn(
  days: number,
  dateReference: Date
): Promise<Subscription[]> {
  await prismaRuntimeReady;
  if (!(dateReference instanceof Date) || isNaN(dateReference.getTime())) {
    throw new Error("dateReference invalide");
  }
  const targetStart = startOfDay(addDays(dateReference, days));
  const targetEnd = endOfDay(addDays(dateReference, days));

  return prisma.subscription.findMany({
    where: {
      statut: SubscriptionStatus.ACTIF,
      dateFin: {
        gte: targetStart,
        lte: targetEnd
      }
    },
    orderBy: { dateFin: "asc" }
  });
}

/* Exemple d'utilisation (pseudo-code) :
async function demoSequence(userId: string) {
  // 1) Création d'un abonnement annuel
  const debut = new Date();
  const fin = addDays(debut, 365);
  const sub = await createSubscriptionForUser({
    userId,
    type: SubscriptionType.ANNUEL,
    dateDebut: debut,
    dateFin: fin,
    montant: 120,
    devise: "EUR",
    source: SubscriptionSource.ONLINE
  });

  // 2) Renouvellement
  await renewSubscription({
    subscriptionId: sub.id,
    nouvelleDateFin: addDays(fin, 365),
    montant: 120,
    source: SubscriptionSource.ONLINE
  });

  // 3) Ajustement de date après litige (admin)
  await adjustSubscriptionEndDate({
    subscriptionId: sub.id,
    nouvelleDateFin: addDays(fin, 400),
    raison: "Geste commercial",
    adminId: "admin-123"
  });

  // 4) Vérification d'accès
  const hasAccess = await hasValidAccessToContent({ userId });
  return hasAccess;
}
*/
