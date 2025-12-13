import { Prisma, SystemEventType as PrismaSystemEventType } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";

// Typage applicatif des événements (verbeux, utile pour l'audit/fraude/support).
export type AppSystemEventType =
  | "CONNEXION_REUSSIE"
  | "CONNEXION_ECHEC"
  | "LECTURE_EDITION"
  | "TENTATIVE_ACCES_SANS_ABONNEMENT"
  | "TENTATIVE_TELECHARGEMENT"
  | "CREATION_ABONNEMENT"
  | "RENOUVELLEMENT_ABONNEMENT"
  | "AJUSTEMENT_ABONNEMENT"
  | "REMBOURSEMENT_ABONNEMENT"
  | "CREATION_CODE_PROMO"
  | "MODIFICATION_CODE_PROMO"
  | "UTILISATION_CODE_PROMO"
  | "CREATION_COMPTE_ENTREPRISE"
  | "MODIFICATION_COMPTE_ENTREPRISE"
  | "AJOUT_UTILISATEUR_ENTREPRISE"
  | "SUPPRESSION_UTILISATEUR_ENTREPRISE"
  | "RAPPEL_EXPIRATION_ABONNEMENT"
  | "EXECUTION_RAPPELS_EXPIRATION"
  | "AUTRE";

// Mapping vers l'enum Prisma (évite de multiplier les valeurs de l'enum DB).
const prismaTypeMap: Partial<Record<AppSystemEventType, PrismaSystemEventType>> = {
  CONNEXION_REUSSIE: PrismaSystemEventType.CONNEXION,
  CONNEXION_ECHEC: PrismaSystemEventType.CONNEXION,
  LECTURE_EDITION: PrismaSystemEventType.LECTURE_EDITION,
  TENTATIVE_TELECHARGEMENT: PrismaSystemEventType.TENTATIVE_TELECHARGEMENT,
  TENTATIVE_ACCES_SANS_ABONNEMENT: PrismaSystemEventType.AUTRE,
  CREATION_ABONNEMENT: PrismaSystemEventType.CREATION_ABONNEMENT,
  RENOUVELLEMENT_ABONNEMENT: PrismaSystemEventType.RENOUVELLEMENT_ABONNEMENT,
  AJUSTEMENT_ABONNEMENT: PrismaSystemEventType.AJUSTEMENT_ABONNEMENT,
  REMBOURSEMENT_ABONNEMENT: PrismaSystemEventType.REMBOURSEMENT,
  CREATION_CODE_PROMO: PrismaSystemEventType.CREATION_CODE_PROMO,
  MODIFICATION_CODE_PROMO: PrismaSystemEventType.MODIFICATION_CODE_PROMO,
  UTILISATION_CODE_PROMO: PrismaSystemEventType.UTILISATION_CODE_PROMO,
  CREATION_COMPTE_ENTREPRISE: PrismaSystemEventType.CREATION_COMPTE_ENTREPRISE,
  MODIFICATION_COMPTE_ENTREPRISE: PrismaSystemEventType.MODIFICATION_COMPTE_ENTREPRISE,
  AJOUT_UTILISATEUR_ENTREPRISE: PrismaSystemEventType.AJOUT_UTILISATEUR_ENTREPRISE,
  SUPPRESSION_UTILISATEUR_ENTREPRISE: PrismaSystemEventType.SUPPRESSION_UTILISATEUR_ENTREPRISE,
  RAPPEL_EXPIRATION_ABONNEMENT: PrismaSystemEventType.RAPPEL_EXPIRATION_ABONNEMENT,
  EXECUTION_RAPPELS_EXPIRATION: PrismaSystemEventType.EXECUTION_RAPPELS_EXPIRATION,
  AUTRE: PrismaSystemEventType.AUTRE
};

/**
 * Journalise un événement applicatif dans SystemEvent.
 * Ajoute toujours `appEventType` dans meta pour conserver la granularité métier.
 */
export async function logSystemEvent(params: {
  type: AppSystemEventType;
  userId?: string | null;
  ip?: string | null;
  meta?: Prisma.JsonValue;
}): Promise<void> {
  const prismaType = prismaTypeMap[params.type] ?? PrismaSystemEventType.AUTRE;
  const mergedMeta: Prisma.InputJsonObject = {
    appEventType: params.type,
    ...(params.meta as Prisma.InputJsonObject | undefined)
  };

  await prisma.systemEvent.create({
    data: {
      typeEvenement: prismaType,
      userId: params.userId ?? null,
      ip: params.ip ?? null,
      meta: mergedMeta
    }
  });
}

// Alias demandé par le prompt (même fonction).
export const logEvent = logSystemEvent;
