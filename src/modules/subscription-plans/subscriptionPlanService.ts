import { Prisma, PlanTargetAudience } from "@prisma/client";
import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";

// Types
export type SubscriptionPlanWithJournalTypes = Prisma.SubscriptionPlanGetPayload<{
  include: { journalTypes: { include: { journalType: true } } };
}>;

export type CreatePlanInput = {
  nom: string;
  slug?: string;
  description?: string;
  targetAudience: PlanTargetAudience;
  durationMonths: number;
  basePrice: number;
  currency?: string;
  // Champs entreprise
  pricePerUser?: number | null;
  minUsers?: number | null;
  maxUsers?: number | null;
  // Affichage
  advantages: string[];
  highlight?: boolean;
  badge?: string;
  displayOrder?: number;
  isActive?: boolean;
  isPublic?: boolean;
  journalTypeIds: string[];
};

export type UpdatePlanInput = Partial<CreatePlanInput>;

// Génère un slug à partir du nom
function generateSlug(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}



/**
 * Liste tous les plans d'abonnement actifs et publics (pour les utilisateurs).
 * @param audience - Filtrer par audience (INDIVIDUAL, ENTERPRISE, ou tous)
 */
export async function listPublicPlans(audience?: PlanTargetAudience): Promise<SubscriptionPlanWithJournalTypes[]> {
  await prismaRuntimeReady;
  return prisma.subscriptionPlan.findMany({
    where: { 
      isActive: true, 
      isPublic: true,
      ...(audience && { targetAudience: audience })
    },
    include: {
      journalTypes: {
        include: { journalType: true }
      }
    },
    orderBy: [{ targetAudience: "asc" }, { displayOrder: "asc" }]
  });
}

/**
 * Liste tous les plans (pour l'admin).
 */
export async function listAllPlans(): Promise<SubscriptionPlanWithJournalTypes[]> {
  return prisma.subscriptionPlan.findMany({
    include: {
      journalTypes: {
        include: { journalType: true }
      }
    },
    orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }]
  });
}

/**
 * Récupère un plan par son ID.
 */
export async function getPlanById(id: string): Promise<SubscriptionPlanWithJournalTypes | null> {
  return prisma.subscriptionPlan.findUnique({
    where: { id },
    include: {
      journalTypes: {
        include: { journalType: true }
      }
    }
  });
}

/**
 * Récupère un plan par son slug.
 */
export async function getPlanBySlug(slug: string): Promise<SubscriptionPlanWithJournalTypes | null> {
  return prisma.subscriptionPlan.findUnique({
    where: { slug },
    include: {
      journalTypes: {
        include: { journalType: true }
      }
    }
  });
}

/**
 * Crée un nouveau plan d'abonnement.
 */
export async function createPlan(input: CreatePlanInput): Promise<SubscriptionPlanWithJournalTypes> {
  const slug = input.slug || generateSlug(input.nom);
  
  // Vérifier l'unicité du slug
  const existing = await prisma.subscriptionPlan.findUnique({ where: { slug } });
  if (existing) {
    throw new Error(`Un plan avec le slug "${slug}" existe déjà.`);
  }

  // Validation pour les plans entreprise
  if (input.targetAudience === "ENTERPRISE") {
    if (!input.minUsers || input.minUsers < 1) {
      throw new Error("Le nombre minimum d'utilisateurs doit être au moins 1 pour un plan entreprise.");
    }
    if (input.pricePerUser === undefined || input.pricePerUser === null) {
      throw new Error("Le prix par utilisateur est requis pour un plan entreprise.");
    }
  }

  return prisma.subscriptionPlan.create({
    data: {
      nom: input.nom,
      slug,
      description: input.description,
      targetAudience: input.targetAudience,
      durationMonths: input.durationMonths,
      basePrice: new Prisma.Decimal(input.basePrice),
      currency: input.currency || "XAF",
      pricePerUser: input.pricePerUser ? new Prisma.Decimal(input.pricePerUser) : null,
      minUsers: input.minUsers || null,
      maxUsers: input.maxUsers || null,
      advantages: input.advantages,
      highlight: input.highlight || false,
      badge: input.badge,
      displayOrder: input.displayOrder || 0,
      isActive: input.isActive ?? true,
      isPublic: input.isPublic ?? true,
      journalTypes: {
        create: input.journalTypeIds.map((journalTypeId) => ({
          journalTypeId
        }))
      }
    },
    include: {
      journalTypes: {
        include: { journalType: true }
      }
    }
  });
}

/**
 * Met à jour un plan existant.
 */
export async function updatePlan(
  id: string,
  input: UpdatePlanInput
): Promise<SubscriptionPlanWithJournalTypes> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) {
    throw new Error("Plan introuvable.");
  }

  // Si on change le nom, recalculer le slug
  let newSlug = plan.slug;
  if (input.nom && input.nom !== plan.nom) {
    newSlug = input.slug || generateSlug(input.nom);
    const existingSlug = await prisma.subscriptionPlan.findFirst({
      where: { slug: newSlug, id: { not: id } }
    });
    if (existingSlug) {
      throw new Error(`Un plan avec le slug "${newSlug}" existe déjà.`);
    }
  }

  // Mise à jour des journalTypes si fournis
  if (input.journalTypeIds) {
    // Supprimer les anciennes liaisons et créer les nouvelles
    await prisma.subscriptionPlanJournalType.deleteMany({ where: { planId: id } });
    await prisma.subscriptionPlanJournalType.createMany({
      data: input.journalTypeIds.map((journalTypeId) => ({
        planId: id,
        journalTypeId
      }))
    });
  }

  return prisma.subscriptionPlan.update({
    where: { id },
    data: {
      ...(input.nom && { nom: input.nom, slug: newSlug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.targetAudience !== undefined && { targetAudience: input.targetAudience }),
      ...(input.durationMonths !== undefined && { durationMonths: input.durationMonths }),
      ...(input.basePrice !== undefined && { basePrice: new Prisma.Decimal(input.basePrice) }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.pricePerUser !== undefined && { pricePerUser: input.pricePerUser ? new Prisma.Decimal(input.pricePerUser) : null }),
      ...(input.minUsers !== undefined && { minUsers: input.minUsers }),
      ...(input.maxUsers !== undefined && { maxUsers: input.maxUsers }),
      ...(input.advantages !== undefined && { advantages: input.advantages }),
      ...(input.highlight !== undefined && { highlight: input.highlight }),
      ...(input.badge !== undefined && { badge: input.badge }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic })
    },
    include: {
      journalTypes: {
        include: { journalType: true }
      }
    }
  });
}

/**
 * Supprime un plan (soft delete via isActive = false, ou hard delete).
 */
export async function deletePlan(id: string, hard = false): Promise<void> {
  if (hard) {
    await prisma.subscriptionPlanJournalType.deleteMany({ where: { planId: id } });
    await prisma.subscriptionPlan.delete({ where: { id } });
  } else {
    await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: false, isPublic: false }
    });
  }
}

/**
 * Vérifie si un abonnement donne accès à un type de journal spécifique.
 */
export async function checkPlanAccessToJournalType(
  planId: string,
  journalTypeId: string
): Promise<boolean> {
  const link = await prisma.subscriptionPlanJournalType.findFirst({
    where: { planId, journalTypeId }
  });
  return !!link;
}

/**
 * Retourne les IDs des types de journaux couverts par un plan.
 */
export async function getJournalTypeIdsForPlan(planId: string): Promise<string[]> {
  const links = await prisma.subscriptionPlanJournalType.findMany({
    where: { planId },
    select: { journalTypeId: true }
  });
  return links.map((l) => l.journalTypeId);
}

/**
 * Calcule le prix total d'un plan en fonction du nombre d'utilisateurs.
 * - Pour un plan INDIVIDUAL : retourne le basePrice
 * - Pour un plan ENTERPRISE : basePrice + (pricePerUser × numberOfUsers)
 */
export function calculatePlanPrice(
  plan: { 
    targetAudience: PlanTargetAudience;
    basePrice: Prisma.Decimal | number;
    pricePerUser?: Prisma.Decimal | number | null;
    minUsers?: number | null;
    maxUsers?: number | null;
  },
  numberOfUsers: number = 1
): { total: number; basePrice: number; pricePerUser: number; users: number } {
  const basePrice = typeof plan.basePrice === "number" 
    ? plan.basePrice 
    : plan.basePrice.toNumber();
  
  if (plan.targetAudience === "INDIVIDUAL") {
    return {
      total: basePrice,
      basePrice,
      pricePerUser: 0,
      users: 1
    };
  }

  // Plan ENTERPRISE
  const pricePerUser = plan.pricePerUser 
    ? (typeof plan.pricePerUser === "number" ? plan.pricePerUser : plan.pricePerUser.toNumber())
    : 0;
  
  // Vérifier les limites min/max
  const minUsers = plan.minUsers || 1;
  const maxUsers = plan.maxUsers || Infinity;
  
  const effectiveUsers = Math.max(minUsers, Math.min(numberOfUsers, maxUsers));
  const total = basePrice + (pricePerUser * effectiveUsers);

  return {
    total,
    basePrice,
    pricePerUser,
    users: effectiveUsers
  };
}

/**
 * Vérifie si un nombre d'utilisateurs est valide pour un plan entreprise.
 */
export function validateEnterpriseUsers(
  plan: { minUsers?: number | null; maxUsers?: number | null },
  numberOfUsers: number
): { valid: boolean; message?: string } {
  const minUsers = plan.minUsers || 1;
  const maxUsers = plan.maxUsers;

  if (numberOfUsers < minUsers) {
    return { 
      valid: false, 
      message: `Le nombre minimum d'utilisateurs pour ce plan est ${minUsers}.` 
    };
  }

  if (maxUsers && numberOfUsers > maxUsers) {
    return { 
      valid: false, 
      message: `Le nombre maximum d'utilisateurs pour ce plan est ${maxUsers}.` 
    };
  }

  return { valid: true };
}
