/**
 * Service centralisé pour la gestion de la corbeille (soft delete).
 * Toutes les entités supprimées sont conservées 7 jours avant suppression définitive.
 */

import { prisma } from "@/lib/config/prisma";
import { fileStorageProvider } from "@/services/fileStorage";

const TRASH_RETENTION_DAYS = 7;

export type TrashableEntity = "user" | "enterprise" | "edition" | "journalType" | "subscription";

export interface TrashItem {
  id: string;
  type: TrashableEntity;
  name: string;
  deletedAt: Date;
  trashedUntil: Date;
  deletedBy?: string;
  meta?: Record<string, unknown>;
}

/**
 * Calcule la date de fin de rétention en corbeille.
 */
export function getTrashedUntilDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + TRASH_RETENTION_DAYS);
  return date;
}

// ========== UTILISATEURS ==========

/**
 * Met un utilisateur en corbeille (soft delete).
 */
export async function trashUser(userId: string, deletedById: string): Promise<void> {
  const trashedUntil = getTrashedUntilDate();
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      trashedUntil,
    },
  });

  // Log l'événement
  await prisma.systemEvent.create({
    data: {
      typeEvenement: "SUPPRESSION_ABONNEMENT",
      userId: deletedById,
      meta: { action: "trash_user", targetUserId: userId, trashedUntil },
    },
  });
}

/**
 * Restaure un utilisateur depuis la corbeille.
 */
export async function restoreUser(userId: string, restoredById: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: null,
      trashedUntil: null,
    },
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "RESTAURATION_ABONNEMENT",
      userId: restoredById,
      meta: { action: "restore_user", targetUserId: userId },
    },
  });
}

/**
 * Supprime définitivement un utilisateur.
 */
export async function permanentlyDeleteUser(userId: string, deletedById: string): Promise<void> {
  // Supprimer les abonnements de l'utilisateur
  await prisma.subscription.deleteMany({ where: { userId } });
  
  // Supprimer les sessions de lecture
  await prisma.readingSession.deleteMany({ where: { userId } });
  
  // Supprimer les progressions de lecture
  await prisma.readingProgress.deleteMany({ where: { userId } });
  
  // Supprimer les événements système
  await prisma.systemEvent.deleteMany({ where: { userId } });
  
  // Supprimer l'utilisateur
  await prisma.user.delete({ where: { id: userId } });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "SUPPRESSION_DEFINITIVE_ABONNEMENT",
      userId: deletedById,
      meta: { action: "permanent_delete_user", targetUserId: userId },
    },
  });
}

// ========== ENTREPRISES ==========

/**
 * Met un compte entreprise en corbeille.
 */
export async function trashEnterprise(enterpriseId: string, deletedById: string): Promise<void> {
  const trashedUntil = getTrashedUntilDate();
  
  await prisma.enterpriseAccount.update({
    where: { id: enterpriseId },
    data: {
      deletedAt: new Date(),
      trashedUntil,
      deletedBy: deletedById,
    },
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "MODIFICATION_COMPTE_ENTREPRISE",
      userId: deletedById,
      meta: { action: "trash_enterprise", enterpriseId, trashedUntil },
    },
  });
}

/**
 * Restaure un compte entreprise.
 */
export async function restoreEnterprise(enterpriseId: string, restoredById: string): Promise<void> {
  await prisma.enterpriseAccount.update({
    where: { id: enterpriseId },
    data: {
      deletedAt: null,
      trashedUntil: null,
      deletedBy: null,
    },
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "MODIFICATION_COMPTE_ENTREPRISE",
      userId: restoredById,
      meta: { action: "restore_enterprise", enterpriseId },
    },
  });
}

/**
 * Supprime définitivement un compte entreprise.
 */
export async function permanentlyDeleteEnterprise(enterpriseId: string, deletedById: string): Promise<void> {
  // Supprimer les invitations
  await prisma.enterpriseInvitation.deleteMany({ where: { enterpriseAccountId: enterpriseId } });
  
  // Supprimer les logs d'audit
  await prisma.enterpriseAuditLog.deleteMany({ where: { enterpriseAccountId: enterpriseId } });
  
  // Supprimer les transactions de licences
  await prisma.enterpriseLicenseTransaction.deleteMany({ where: { enterpriseAccountId: enterpriseId } });
  
  // Détacher les utilisateurs
  await prisma.user.updateMany({
    where: { enterpriseAccountId: enterpriseId },
    data: { enterpriseAccountId: null, enterpriseRole: null, enterpriseStatus: null },
  });
  
  // Supprimer les abonnements entreprise
  await prisma.subscription.deleteMany({ where: { enterpriseAccountId: enterpriseId } });
  
  // Supprimer l'entreprise
  await prisma.enterpriseAccount.delete({ where: { id: enterpriseId } });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "MODIFICATION_COMPTE_ENTREPRISE",
      userId: deletedById,
      meta: { action: "permanent_delete_enterprise", enterpriseId },
    },
  });
}

// ========== EDITIONS ==========

/**
 * Met une édition en corbeille.
 */
export async function trashEdition(editionId: string, deletedById: string): Promise<void> {
  const trashedUntil = getTrashedUntilDate();
  
  await prisma.edition.update({
    where: { id: editionId },
    data: {
      deletedAt: new Date(),
      trashedUntil,
      deletedBy: deletedById,
    },
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "AUTRE",
      userId: deletedById,
      meta: { action: "trash_edition", editionId, trashedUntil },
    },
  });
}

/**
 * Restaure une édition.
 */
export async function restoreEdition(editionId: string, restoredById: string): Promise<void> {
  await prisma.edition.update({
    where: { id: editionId },
    data: {
      deletedAt: null,
      trashedUntil: null,
      deletedBy: null,
    },
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "AUTRE",
      userId: restoredById,
      meta: { action: "restore_edition", editionId },
    },
  });
}

/**
 * Supprime définitivement une édition (y compris fichiers Cloudflare R2).
 */
export async function permanentlyDeleteEdition(editionId: string, deletedById: string): Promise<void> {
  const edition = await prisma.edition.findUnique({
    where: { id: editionId },
    select: { cheminInternePdf: true, cheminImageUne: true },
  });

  if (!edition) {
    throw new Error("Édition non trouvée");
  }

  // Supprimer les sessions de lecture
  await prisma.readingSession.deleteMany({ where: { editionId } });
  
  // Supprimer les progressions de lecture
  await prisma.readingProgress.deleteMany({ where: { editionId } });

  // Supprimer les fichiers du stockage (Cloudflare R2 ou local)
  try {
    if (edition.cheminInternePdf) {
      await fileStorageProvider.deleteFile({ path: edition.cheminInternePdf });
    }
    if (edition.cheminImageUne) {
      await fileStorageProvider.deleteFile({ path: edition.cheminImageUne });
    }
  } catch (error) {
    console.error("[trashService] Erreur suppression fichiers:", error);
    // Continue même si la suppression des fichiers échoue
  }

  // Supprimer l'édition
  await prisma.edition.delete({ where: { id: editionId } });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "AUTRE",
      userId: deletedById,
      meta: { action: "permanent_delete_edition", editionId },
    },
  });
}

// ========== TYPES DE JOURNAUX ==========

/**
 * Met un type de journal en corbeille.
 */
export async function trashJournalType(journalTypeId: string, deletedById: string): Promise<void> {
  const trashedUntil = getTrashedUntilDate();
  
  await prisma.journalType.update({
    where: { id: journalTypeId },
    data: {
      deletedAt: new Date(),
      trashedUntil,
      deletedBy: deletedById,
      isActive: false, // Désactiver automatiquement
    },
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "AUTRE",
      userId: deletedById,
      meta: { action: "trash_journal_type", journalTypeId, trashedUntil },
    },
  });
}

/**
 * Restaure un type de journal.
 */
export async function restoreJournalType(journalTypeId: string, restoredById: string): Promise<void> {
  await prisma.journalType.update({
    where: { id: journalTypeId },
    data: {
      deletedAt: null,
      trashedUntil: null,
      deletedBy: null,
      isActive: true,
    },
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "AUTRE",
      userId: restoredById,
      meta: { action: "restore_journal_type", journalTypeId },
    },
  });
}

/**
 * Supprime définitivement un type de journal.
 */
export async function permanentlyDeleteJournalType(journalTypeId: string, deletedById: string): Promise<void> {
  // Vérifier s'il y a des éditions liées
  const editionsCount = await prisma.edition.count({
    where: { journalTypeId, deletedAt: null },
  });

  if (editionsCount > 0) {
    throw new Error(`Impossible de supprimer: ${editionsCount} édition(s) sont liées à ce type`);
  }

  // Supprimer les liens avec les plans d'abonnement
  await prisma.subscriptionPlanJournalType.deleteMany({
    where: { journalTypeId },
  });

  // Supprimer le type de journal
  await prisma.journalType.delete({ where: { id: journalTypeId } });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "AUTRE",
      userId: deletedById,
      meta: { action: "permanent_delete_journal_type", journalTypeId },
    },
  });
}

// ========== CORBEILLE GLOBALE ==========

/**
 * Liste tous les éléments en corbeille.
 */
export async function listTrashItems(): Promise<TrashItem[]> {
  const items: TrashItem[] = [];

  // Utilisateurs supprimés
  const users = await prisma.user.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, nom: true, email: true, deletedAt: true, trashedUntil: true },
  });
  
  for (const user of users) {
    if (user.deletedAt && user.trashedUntil) {
      items.push({
        id: user.id,
        type: "user",
        name: user.nom || user.email,
        deletedAt: user.deletedAt,
        trashedUntil: user.trashedUntil,
        meta: { email: user.email },
      });
    }
  }

  // Entreprises supprimées
  const enterprises = await prisma.enterpriseAccount.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, nom: true, contactEmail: true, deletedAt: true, trashedUntil: true, deletedBy: true },
  });
  
  for (const enterprise of enterprises) {
    if (enterprise.deletedAt && enterprise.trashedUntil) {
      items.push({
        id: enterprise.id,
        type: "enterprise",
        name: enterprise.nom,
        deletedAt: enterprise.deletedAt,
        trashedUntil: enterprise.trashedUntil,
        deletedBy: enterprise.deletedBy || undefined,
        meta: { email: enterprise.contactEmail },
      });
    }
  }

  // Éditions supprimées
  const editions = await prisma.edition.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, titre: true, datePublication: true, deletedAt: true, trashedUntil: true, deletedBy: true },
  });
  
  for (const edition of editions) {
    if (edition.deletedAt && edition.trashedUntil) {
      items.push({
        id: edition.id,
        type: "edition",
        name: edition.titre,
        deletedAt: edition.deletedAt,
        trashedUntil: edition.trashedUntil,
        deletedBy: edition.deletedBy || undefined,
        meta: { datePublication: edition.datePublication },
      });
    }
  }

  // Types de journaux supprimés
  const journalTypes = await prisma.journalType.findMany({
    where: { deletedAt: { not: null } },
    select: { id: true, name: true, deletedAt: true, trashedUntil: true, deletedBy: true },
  });
  
  for (const jt of journalTypes) {
    if (jt.deletedAt && jt.trashedUntil) {
      items.push({
        id: jt.id,
        type: "journalType",
        name: jt.name,
        deletedAt: jt.deletedAt,
        trashedUntil: jt.trashedUntil,
        deletedBy: jt.deletedBy || undefined,
      });
    }
  }

  // Abonnements supprimés
  const subscriptions = await prisma.subscription.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      type: true,
      deletedAt: true,
      trashedUntil: true,
      user: { select: { nom: true, email: true } },
    },
  });
  
  for (const sub of subscriptions) {
    if (sub.deletedAt && sub.trashedUntil) {
      items.push({
        id: sub.id,
        type: "subscription",
        name: `${sub.type} - ${sub.user?.nom || sub.user?.email || "N/A"}`,
        deletedAt: sub.deletedAt,
        trashedUntil: sub.trashedUntil,
        meta: { subscriptionType: sub.type },
      });
    }
  }

  // Trier par date de suppression (plus récent en premier)
  return items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

/**
 * Supprime définitivement tous les éléments expirés de la corbeille.
 * À appeler via un cron job quotidien.
 */
export async function purgeExpiredTrashItems(): Promise<{ purged: number }> {
  const now = new Date();
  let purged = 0;

  // Utilisateurs expirés
  const expiredUsers = await prisma.user.findMany({
    where: { trashedUntil: { lt: now }, deletedAt: { not: null } },
    select: { id: true },
  });
  for (const user of expiredUsers) {
    try {
      await permanentlyDeleteUser(user.id, "system");
      purged++;
    } catch (e) {
      console.error(`[purge] Failed to delete user ${user.id}:`, e);
    }
  }

  // Entreprises expirées
  const expiredEnterprises = await prisma.enterpriseAccount.findMany({
    where: { trashedUntil: { lt: now }, deletedAt: { not: null } },
    select: { id: true },
  });
  for (const enterprise of expiredEnterprises) {
    try {
      await permanentlyDeleteEnterprise(enterprise.id, "system");
      purged++;
    } catch (e) {
      console.error(`[purge] Failed to delete enterprise ${enterprise.id}:`, e);
    }
  }

  // Éditions expirées
  const expiredEditions = await prisma.edition.findMany({
    where: { trashedUntil: { lt: now }, deletedAt: { not: null } },
    select: { id: true },
  });
  for (const edition of expiredEditions) {
    try {
      await permanentlyDeleteEdition(edition.id, "system");
      purged++;
    } catch (e) {
      console.error(`[purge] Failed to delete edition ${edition.id}:`, e);
    }
  }

  // Types de journaux expirés
  const expiredJournalTypes = await prisma.journalType.findMany({
    where: { trashedUntil: { lt: now }, deletedAt: { not: null } },
    select: { id: true },
  });
  for (const jt of expiredJournalTypes) {
    try {
      await permanentlyDeleteJournalType(jt.id, "system");
      purged++;
    } catch (e) {
      console.error(`[purge] Failed to delete journal type ${jt.id}:`, e);
    }
  }

  return { purged };
}
