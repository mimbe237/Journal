import { EnterpriseAccount, SystemEventType, User, UserRole } from "@prisma/client";

import { prisma } from "@/lib/config/prisma";
import { getActiveSubscriptionForEnterprise, getActiveSubscriptionForUser } from "@/modules/subscriptions/subscriptionService";
import { canAddUsers, syncEnterpriseCounters } from "@/modules/enterprises/licenseService";

// ---- Helpers internes ----

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

async function countUsersInEnterprise(enterpriseAccountId: string): Promise<number> {
  return prisma.user.count({ where: { enterpriseAccountId } });
}

// ---- Service Entreprise ----

/**
 * Création d'un compte entreprise (B2B).
 */
export async function createEnterpriseAccount(params: {
  nom: string;
  contactEmail: string;
  contactTelephone?: string | null;
  nombreUtilisateursInclus: number;
}): Promise<EnterpriseAccount> {
  if (!params.nom?.trim()) throw new Error("nom requis");
  if (!params.contactEmail || !isValidEmail(params.contactEmail)) {
    throw new Error("contactEmail invalide");
  }
  if (!params.nombreUtilisateursInclus || params.nombreUtilisateursInclus <= 0) {
    throw new Error("nombreUtilisateursInclus doit être > 0");
  }

  const enterprise = await prisma.$transaction(async (tx) => {
    const created = await tx.enterpriseAccount.create({
      data: {
        nom: params.nom.trim(),
        contactEmail: params.contactEmail.trim().toLowerCase(),
        contactTelephone: params.contactTelephone ?? null,
        nombreUtilisateursInclus: params.nombreUtilisateursInclus,
        licencesAchetees: params.nombreUtilisateursInclus  // Synchroniser les deux champs
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.CREATION_COMPTE_ENTREPRISE,
        meta: { enterpriseAccountId: created.id, nom: created.nom }
      }
    });

    return created;
  });

  return enterprise;
}

/**
 * Mise à jour d'un compte entreprise.
 */
export async function updateEnterpriseAccount(params: {
  id: string;
  nom?: string;
  contactEmail?: string;
  contactTelephone?: string | null;
  nombreUtilisateursInclus?: number;
}): Promise<EnterpriseAccount> {
  if (params.contactEmail && !isValidEmail(params.contactEmail)) {
    throw new Error("contactEmail invalide");
  }
  if (params.nombreUtilisateursInclus !== undefined && params.nombreUtilisateursInclus <= 0) {
    throw new Error("nombreUtilisateursInclus doit être > 0");
  }

  const existing = await prisma.enterpriseAccount.findUnique({ where: { id: params.id } });
  if (!existing) throw new Error("Compte entreprise introuvable");

  const updated = await prisma.$transaction(async (tx) => {
    const enterprise = await tx.enterpriseAccount.update({
      where: { id: params.id },
      data: {
        nom: params.nom?.trim() ?? undefined,
        contactEmail: params.contactEmail?.trim().toLowerCase() ?? undefined,
        contactTelephone: params.contactTelephone === undefined ? undefined : params.contactTelephone,
        nombreUtilisateursInclus: params.nombreUtilisateursInclus ?? undefined
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.MODIFICATION_COMPTE_ENTREPRISE,
        meta: {
          enterpriseAccountId: enterprise.id,
          nomAvant: existing.nom,
          nomApres: enterprise.nom
        }
      }
    });

    return enterprise;
  });

  return updated;
}

/**
 * Associe un utilisateur à une entreprise avec rôle adéquat.
 */
export async function assignUserToEnterpriseAccount(params: {
  enterpriseAccountId: string;
  userId: string;
  role: "COMPTE_ENTREPRISE" | "UTILISATEUR_ENTREPRISE";
}): Promise<User> {
  const enterprise = await prisma.enterpriseAccount.findUnique({ where: { id: params.enterpriseAccountId } });
  if (!enterprise) throw new Error("Compte entreprise introuvable");

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  if (user.enterpriseAccountId && user.enterpriseAccountId !== params.enterpriseAccountId) {
    throw new Error("L'utilisateur est déjà rattaché à une autre entreprise");
  }

  // Vérifier le quota de licences disponibles
  const licenseCheck = await canAddUsers(params.enterpriseAccountId, 1);
  if (!licenseCheck.allowed) {
    throw new Error(licenseCheck.message || "Quota de licences atteint. Achetez des licences supplémentaires.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: params.userId },
      data: {
        enterpriseAccountId: params.enterpriseAccountId,
        role: params.role === "COMPTE_ENTREPRISE" ? UserRole.COMPTE_ENTREPRISE : UserRole.UTILISATEUR_ENTREPRISE
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.AJOUT_UTILISATEUR_ENTREPRISE,
        userId: updatedUser.id,
        meta: {
          enterpriseAccountId: params.enterpriseAccountId,
          role: updatedUser.role
        }
      }
    });

    return updatedUser;
  });

  return updated;
}

/**
 * Retire un utilisateur d'une entreprise (repasse en ABONNE par défaut).
 */
export async function removeUserFromEnterpriseAccount(params: {
  enterpriseAccountId: string;
  userId: string;
}): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) throw new Error("Utilisateur introuvable");
  if (user.enterpriseAccountId !== params.enterpriseAccountId) {
    throw new Error("L'utilisateur n'appartient pas à cette entreprise");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: params.userId },
      data: {
        enterpriseAccountId: null,
        role: UserRole.ABONNE // Retour au rôle de base
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.SUPPRESSION_UTILISATEUR_ENTREPRISE,
        userId: updatedUser.id,
        meta: { enterpriseAccountId: params.enterpriseAccountId }
      }
    });

    return updatedUser;
  });

  return updated;
}

/**
 * Liste tous les utilisateurs d'une entreprise.
 */
export function listEnterpriseUsers(enterpriseAccountId: string): Promise<User[]> {
  return prisma.user.findMany({
    where: { enterpriseAccountId },
    orderBy: { nom: "asc" }
  });
}

/**
 * Vérifie qu'un utilisateur B2B a accès (abonnement entreprise actif).
 */
export async function canEnterpriseUserAccessEdition(params: {
  userId: string;
  editionId: string;
}): Promise<boolean> {
  // editionId non utilisé ici (c'est l'abonnement qui est checké). Gardé pour future granularité.
  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user?.enterpriseAccountId) return false;

  const sub = await getActiveSubscriptionForEnterprise(user.enterpriseAccountId);
  return Boolean(sub);
}

/**
 * Vérifie si un user peut accéder à une édition (abonnement individuel OU entreprise).
 * Utilisable côté API de lecture.
 */
export async function canUserAccessEdition(params: { userId: string; editionId: string }): Promise<boolean> {
  const hasIndividual = await getActiveSubscriptionForUser(params.userId);
  if (hasIndividual) return true;

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user?.enterpriseAccountId) return false;

  const hasEnterprise = await getActiveSubscriptionForEnterprise(user.enterpriseAccountId);
  return Boolean(hasEnterprise);
}

/* Exemple de scénario B2B (documentation interne) :
1) ADMIN crée un EnterpriseAccount (ex: "Bibliothèque Centrale").
2) ADMIN crée un Subscription pour cette entreprise via subscriptionService (createSubscriptionForEnterprise/withPromo).
3) ADMIN ou COMPTE_ENTREPRISE associe des UTILISATEUR_ENTREPRISE via assignUserToEnterpriseAccount.
4) Les utilisateurs se connectent ; l'accès à la lecture vérifie d'abord un abonnement individuel puis l'abonnement entreprise.
*/
