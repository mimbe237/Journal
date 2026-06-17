import { 
  EnterpriseAccount, 
  EnterpriseLicenseTransaction, 
  LicenseTransactionType,
  SystemEventType,
  Prisma 
} from "@prisma/client";

import { prisma } from "@/lib/config/prisma";

// ---- Types ----

export interface LicenseSummary {
  enterpriseId: string;
  enterpriseName: string;
  achetees: number;          // Total licences achetées
  utilisees: number;         // Utilisateurs actifs
  invitationsPending: number; // Invitations en attente
  disponibles: number;       // Licences libres (achetees - utilisees - pending)
  pourcentageUtilisation: number;
}

export interface PurchaseLicenseParams {
  enterpriseId: string;
  quantity: number;
  prixUnitaire?: number;
  montantTotal?: number;
  devise?: string;
  paymentRef?: string;
  reason?: string;
  createdBy: string;  // userId de l'admin
  meta?: Prisma.JsonValue;
}

export interface AdjustLicenseParams {
  enterpriseId: string;
  delta: number;  // Peut être négatif
  reason: string;
  createdBy: string;
  meta?: Prisma.JsonValue;
}

export type TransactionWithCreator = EnterpriseLicenseTransaction & {
  creator: { id: string; nom: string; email: string };
};

// ---- Service ----

/**
 * Récupère le résumé des licences pour une entreprise.
 */
export async function getLicenseSummary(enterpriseId: string): Promise<LicenseSummary> {
  const enterprise = await prisma.enterpriseAccount.findUnique({
    where: { id: enterpriseId },
    select: {
      id: true,
      nom: true,
      licencesAchetees: true,
      nombreUtilisateursInclus: true, // Legacy, au cas où
    }
  });

  if (!enterprise) {
    throw new Error("Compte entreprise introuvable");
  }

  // Compter les utilisateurs actifs
  const utilisees = await prisma.user.count({
    where: { 
      enterpriseAccountId: enterpriseId,
      deletedAt: null
    }
  });

  // Compter les invitations en attente
  const invitationsPending = await prisma.enterpriseInvitation.count({
    where: {
      enterpriseAccountId: enterpriseId,
      acceptedAt: null,
      expireAt: { gt: new Date() }
    }
  });

  // Utiliser licencesAchetees, ou fallback sur nombreUtilisateursInclus (legacy)
  const achetees = enterprise.licencesAchetees || enterprise.nombreUtilisateursInclus || 0;
  const disponibles = Math.max(0, achetees - utilisees - invitationsPending);
  const pourcentageUtilisation = achetees > 0 
    ? Math.round(((utilisees + invitationsPending) / achetees) * 100) 
    : 0;

  return {
    enterpriseId: enterprise.id,
    enterpriseName: enterprise.nom,
    achetees,
    utilisees,
    invitationsPending,
    disponibles,
    pourcentageUtilisation
  };
}

/**
 * Vérifie si on peut ajouter N utilisateurs à une entreprise.
 */
export async function canAddUsers(
  enterpriseId: string, 
  count: number = 1
): Promise<{ allowed: boolean; message?: string; disponibles: number }> {
  const summary = await getLicenseSummary(enterpriseId);
  
  if (summary.disponibles >= count) {
    return { allowed: true, disponibles: summary.disponibles };
  }

  const needed = count - summary.disponibles;
  return {
    allowed: false,
    disponibles: summary.disponibles,
    message: `Quota de licences atteint. ${summary.utilisees + summary.invitationsPending}/${summary.achetees} utilisées. Achetez ${needed} licence(s) supplémentaire(s).`
  };
}

/**
 * Achète des licences pour une entreprise.
 * Crée une transaction tracée et met à jour le quota.
 */
export async function purchaseLicenses(params: PurchaseLicenseParams): Promise<{
  transaction: EnterpriseLicenseTransaction;
  newTotal: number;
}> {
  if (params.quantity <= 0) {
    throw new Error("La quantité doit être supérieure à 0");
  }

  const result = await prisma.$transaction(async (tx) => {
    // Vérifier que l'entreprise existe
    const enterprise = await tx.enterpriseAccount.findUnique({
      where: { id: params.enterpriseId },
      select: { id: true, licencesAchetees: true, nombreUtilisateursInclus: true }
    });

    if (!enterprise) {
      throw new Error("Compte entreprise introuvable");
    }

    const currentLicenses = enterprise.licencesAchetees || enterprise.nombreUtilisateursInclus || 0;
    const newTotal = currentLicenses + params.quantity;

    // Créer la transaction de licence
    const transaction = await tx.enterpriseLicenseTransaction.create({
      data: {
        enterpriseAccountId: params.enterpriseId,
        type: LicenseTransactionType.ACHAT,
        delta: params.quantity,
        reason: params.reason || `Achat de ${params.quantity} licence(s)`,
        paymentRef: params.paymentRef,
        prixUnitaire: params.prixUnitaire ? new Prisma.Decimal(params.prixUnitaire) : null,
        montantTotal: params.montantTotal 
          ? new Prisma.Decimal(params.montantTotal) 
          : params.prixUnitaire 
            ? new Prisma.Decimal(params.prixUnitaire * params.quantity)
            : null,
        devise: params.devise || "XAF",
        createdBy: params.createdBy,
        meta: params.meta ?? Prisma.JsonNull
      }
    });

    // Mettre à jour le quota de l'entreprise
    await tx.enterpriseAccount.update({
      where: { id: params.enterpriseId },
      data: { 
        licencesAchetees: newTotal,
        nombreUtilisateursInclus: newTotal // Maintenir la compatibilité
      }
    });

    // Logger l'événement système
    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.ACHAT_LICENCE_ENTREPRISE,
        userId: params.createdBy,
        meta: {
          enterpriseAccountId: params.enterpriseId,
          transactionId: transaction.id,
          quantity: params.quantity,
          newTotal,
          paymentRef: params.paymentRef,
          montantTotal: params.montantTotal
        }
      }
    });

    return { transaction, newTotal };
  });

  return result;
}

/**
 * Ajuste manuellement le nombre de licences (correction, geste commercial, remboursement).
 */
export async function adjustLicenses(params: AdjustLicenseParams): Promise<{
  transaction: EnterpriseLicenseTransaction;
  newTotal: number;
}> {
  if (params.delta === 0) {
    throw new Error("Le delta ne peut pas être 0");
  }

  if (!params.reason?.trim()) {
    throw new Error("Une raison est requise pour un ajustement");
  }

  const result = await prisma.$transaction(async (tx) => {
    const enterprise = await tx.enterpriseAccount.findUnique({
      where: { id: params.enterpriseId },
      select: { id: true, licencesAchetees: true, nombreUtilisateursInclus: true }
    });

    if (!enterprise) {
      throw new Error("Compte entreprise introuvable");
    }

    const currentLicenses = enterprise.licencesAchetees || enterprise.nombreUtilisateursInclus || 0;
    const newTotal = currentLicenses + params.delta;

    if (newTotal < 0) {
      throw new Error("Le nombre de licences ne peut pas être négatif");
    }

    // Vérifier qu'on ne retire pas plus de licences que disponibles
    if (params.delta < 0) {
      const utilisees = await tx.user.count({
        where: { enterpriseAccountId: params.enterpriseId, deletedAt: null }
      });
      
      if (newTotal < utilisees) {
        throw new Error(`Impossible de réduire à ${newTotal} licences. ${utilisees} utilisateurs actifs.`);
      }
    }

    const transactionType = params.delta > 0 
      ? LicenseTransactionType.AJUSTEMENT_ADMIN 
      : LicenseTransactionType.REMBOURSEMENT;

    const transaction = await tx.enterpriseLicenseTransaction.create({
      data: {
        enterpriseAccountId: params.enterpriseId,
        type: transactionType,
        delta: params.delta,
        reason: params.reason.trim(),
        createdBy: params.createdBy,
        meta: params.meta ?? Prisma.JsonNull
      }
    });

    await tx.enterpriseAccount.update({
      where: { id: params.enterpriseId },
      data: { 
        licencesAchetees: newTotal,
        nombreUtilisateursInclus: newTotal
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.AJUSTEMENT_LICENCE_ENTREPRISE,
        userId: params.createdBy,
        meta: {
          enterpriseAccountId: params.enterpriseId,
          transactionId: transaction.id,
          delta: params.delta,
          previousTotal: currentLicenses,
          newTotal,
          reason: params.reason
        }
      }
    });

    return { transaction, newTotal };
  });

  return result;
}

/**
 * Récupère l'historique des transactions de licences.
 */
export async function getLicenseTransactions(
  enterpriseId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ transactions: TransactionWithCreator[]; total: number }> {
  const [transactions, total] = await Promise.all([
    prisma.enterpriseLicenseTransaction.findMany({
      where: { enterpriseAccountId: enterpriseId },
      include: {
        creator: {
          select: { id: true, nom: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0
    }),
    prisma.enterpriseLicenseTransaction.count({
      where: { enterpriseAccountId: enterpriseId }
    })
  ]);

  return { transactions, total };
}

/**
 * Recalcule et synchronise les compteurs de l'entreprise.
 * Utile pour la maintenance ou après une migration.
 */
export async function syncEnterpriseCounters(enterpriseId: string): Promise<void> {
  const [utilisateursActifs, utilisateursInvites] = await Promise.all([
    prisma.user.count({
      where: { enterpriseAccountId: enterpriseId, deletedAt: null }
    }),
    prisma.enterpriseInvitation.count({
      where: {
        enterpriseAccountId: enterpriseId,
        acceptedAt: null,
        expireAt: { gt: new Date() }
      }
    })
  ]);

  await prisma.enterpriseAccount.update({
    where: { id: enterpriseId },
    data: {
      nombreUtilisateursActifs: utilisateursActifs,
      nombreUtilisateursInvites: utilisateursInvites
    }
  });
}
