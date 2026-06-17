import { Prisma, PromoCode, DiscountType, SystemEventType } from "@prisma/client";

import { prisma } from "@/lib/config/prisma";

// ---- Service codes promo ----

/**
 * Crée un code promo unique.
 */
export async function createPromoCode(params: {
  code: string;
  typeRemise: DiscountType;
  valeurRemise: number;
  dateDebut: Date;
  dateFin: Date;
  nombreUtilisationsMax?: number | null;
  actif: boolean;
}): Promise<PromoCode> {
  const code = params.code.trim().toUpperCase();
  if (!code) {
    throw new Error("Code promo manquant");
  }
  if (params.valeurRemise <= 0) {
    throw new Error("La valeur de remise doit être > 0");
  }

  const exists = await prisma.promoCode.findUnique({ where: { code } });
  if (exists) {
    throw new Error("Ce code promo existe déjà");
  }

  if (!(params.dateDebut instanceof Date) || !(params.dateFin instanceof Date)) {
    throw new Error("Dates invalides");
  }
  if (params.dateDebut >= params.dateFin) {
    throw new Error("dateDebut doit être antérieure à dateFin");
  }

  const created = await prisma.$transaction(async (tx) => {
    const promo = await tx.promoCode.create({
      data: {
        code,
        typeRemise: params.typeRemise,
        valeurRemise: new Prisma.Decimal(params.valeurRemise),
        dateDebut: params.dateDebut,
        dateFin: params.dateFin,
        nombreUtilisationsMax: params.nombreUtilisationsMax ?? null,
        nombreUtilisationsActuel: 0,
        actif: params.actif
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.CREATION_CODE_PROMO,
        meta: { promoCodeId: promo.id, code: promo.code }
      }
    });

    return promo;
  });

  return created;
}

/**
 * Met à jour un code promo (supporte le changement de code en conservant l'unicité).
 */
export async function updatePromoCode(params: {
  id: string;
  code?: string;
  typeRemise?: DiscountType;
  valeurRemise?: number;
  dateDebut?: Date;
  dateFin?: Date;
  nombreUtilisationsMax?: number | null;
  actif?: boolean;
}): Promise<PromoCode> {
  const existing = await prisma.promoCode.findUnique({ where: { id: params.id } });
  if (!existing) {
    throw new Error("Code promo introuvable");
  }

  if (params.code) {
    const code = params.code.trim().toUpperCase();
    if (code !== existing.code) {
      const already = await prisma.promoCode.findUnique({ where: { code } });
      if (already) {
        throw new Error("Un autre code promo possède déjà ce code");
      }
    }
  }

  if (params.dateDebut && params.dateFin && params.dateDebut >= params.dateFin) {
    throw new Error("dateDebut doit être antérieure à dateFin");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const promo = await tx.promoCode.update({
      where: { id: params.id },
      data: {
        code: params.code?.trim().toUpperCase() ?? undefined,
        typeRemise: params.typeRemise ?? undefined,
        valeurRemise:
          typeof params.valeurRemise === "number"
            ? new Prisma.Decimal(params.valeurRemise)
            : undefined,
        dateDebut: params.dateDebut ?? undefined,
        dateFin: params.dateFin ?? undefined,
        nombreUtilisationsMax:
          params.nombreUtilisationsMax === undefined ? undefined : params.nombreUtilisationsMax,
        actif: params.actif ?? undefined
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.MODIFICATION_CODE_PROMO,
        meta: { promoCodeId: promo.id, codeAvant: existing.code, codeApres: promo.code }
      }
    });

    return promo;
  });

  return updated;
}

/**
 * Récupère un code promo par son code.
 */
export function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  return prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
}

/**
 * Valide un code promo (période, statut, quotas).
 */
export async function validatePromoCode(params: {
  code: string;
  dateUsage: Date;
  userId?: string | null;
}): Promise<PromoCode> {
  const promo = await getPromoCodeByCode(params.code);
  if (!promo) {
    throw new Error("Code promo inexistant");
  }
  if (!promo.actif) {
    throw new Error("Code promo désactivé");
  }
  const usage = params.dateUsage;
  if (!(usage instanceof Date) || isNaN(usage.getTime())) {
    throw new Error("dateUsage invalide");
  }
  if (usage < promo.dateDebut) {
    throw new Error("Code promo non encore valide");
  }
  if (usage > promo.dateFin) {
    throw new Error("Code promo expiré");
  }
  if (promo.nombreUtilisationsMax !== null && promo.nombreUtilisationsMax !== undefined) {
    if (promo.nombreUtilisationsActuel >= promo.nombreUtilisationsMax) {
      throw new Error("Limite d'utilisation atteinte pour ce code promo");
    }
  }

  // TODO: Empêcher la réutilisation par le même user selon la politique produit.
  return promo;
}

/**
 * Incrémente l'utilisation d'un code promo (à faire après création d'abonnement).
 */
export async function incrementPromoCodeUsage(
  promoCodeId: string,
  tx: Prisma.TransactionClient = prisma
): Promise<void> {
  await tx.promoCode.update({
    where: { id: promoCodeId },
    data: { nombreUtilisationsActuel: { increment: 1 } }
  });
}

/**
 * Calcule le montant remisé (plafonné à 0).
 */
export function calculateDiscountedAmount(params: {
  montantInitial: number;
  typeRemise: DiscountType;
  valeurRemise: number;
}): number {
  let montantFinal = params.montantInitial;
  if (params.typeRemise === "POURCENTAGE") {
    montantFinal = params.montantInitial - (params.montantInitial * params.valeurRemise) / 100;
  } else {
    montantFinal = params.montantInitial - params.valeurRemise;
  }
  return Math.max(montantFinal, 0);
}
