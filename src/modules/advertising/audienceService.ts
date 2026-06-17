/**
 * Service de gestion des segments d'audience
 * 
 * Gère la création, mise à jour et résolution des segments
 * pour le ciblage publicitaire.
 */

import { prisma } from "@/lib/config/prisma";
import { OrganizationType, OrganizationSize, InterestCategory, Prisma } from "@prisma/client";

// Types pour les filtres de segment
export type AudienceFilters = {
  // Types d'organisation ciblés
  organizationTypes?: OrganizationType[];
  // Tailles d'organisation
  organizationSizes?: OrganizationSize[];
  // Centres d'intérêt
  interests?: InterestCategory[];
  // Pays (codes ISO)
  countries?: string[];
  // Régions
  regions?: string[];
  // Inclure les particuliers B2C
  includeB2C?: boolean;
  // Exclure certains utilisateurs
  excludeUserIds?: string[];
};

export type CreateSegmentInput = {
  nom: string;
  description?: string;
  filters: AudienceFilters;
};

export type UpdateSegmentInput = Partial<CreateSegmentInput> & {
  isActive?: boolean;
};

/**
 * Crée un nouveau segment d'audience.
 */
export async function createSegment(input: CreateSegmentInput) {
  const segment = await prisma.audienceSegment.create({
    data: {
      nom: input.nom,
      description: input.description,
      filters: input.filters as Prisma.InputJsonValue,
    },
  });

  // Calculer le reach estimé
  await refreshSegmentReach(segment.id);

  return prisma.audienceSegment.findUnique({
    where: { id: segment.id },
  });
}

/**
 * Met à jour un segment.
 */
export async function updateSegment(id: string, input: UpdateSegmentInput) {
  const segment = await prisma.audienceSegment.update({
    where: { id },
    data: {
      nom: input.nom,
      description: input.description,
      filters: input.filters as Prisma.InputJsonValue | undefined,
      isActive: input.isActive,
    },
  });

  // Recalculer le reach si les filtres ont changé
  if (input.filters) {
    await refreshSegmentReach(id);
  }

  return prisma.audienceSegment.findUnique({
    where: { id },
  });
}

/**
 * Récupère un segment par son ID.
 */
export async function getSegmentById(id: string) {
  return prisma.audienceSegment.findUnique({
    where: { id },
    include: {
      _count: {
        select: { campaigns: true },
      },
    },
  });
}

/**
 * Liste tous les segments.
 */
export async function listSegments(activeOnly: boolean = false) {
  return prisma.audienceSegment.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { nom: "asc" },
    include: {
      _count: {
        select: { campaigns: true },
      },
    },
  });
}

/**
 * Supprime un segment.
 */
export async function deleteSegment(id: string) {
  return prisma.audienceSegment.delete({
    where: { id },
  });
}

/**
 * Rafraîchit le reach estimé d'un segment.
 */
export async function refreshSegmentReach(segmentId: string) {
  const segment = await prisma.audienceSegment.findUnique({
    where: { id: segmentId },
  });

  if (!segment) return;

  const filters = segment.filters as AudienceFilters;
  const count = await countUsersMatchingFilters(filters);

  return prisma.audienceSegment.update({
    where: { id: segmentId },
    data: {
      estimatedReach: count,
      lastRefreshedAt: new Date(),
    },
  });
}

/**
 * Rafraîchit le reach de tous les segments actifs.
 * À appeler via un job périodique (1-2x par jour).
 */
export async function refreshAllSegmentsReach() {
  const segments = await prisma.audienceSegment.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  for (const segment of segments) {
    await refreshSegmentReach(segment.id);
  }

  return segments.length;
}

/**
 * Compte les utilisateurs correspondant à des filtres donnés.
 */
export async function countUsersMatchingFilters(filters: AudienceFilters): Promise<number> {
  const userWhere = buildUserWhereClause(filters);
  return prisma.user.count({ where: userWhere });
}

/**
 * Récupère les IDs des utilisateurs correspondant à des filtres.
 */
export async function getUserIdsMatchingFilters(filters: AudienceFilters): Promise<string[]> {
  const userWhere = buildUserWhereClause(filters);
  
  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true },
  });

  return users.map((u) => u.id);
}

/**
 * Vérifie si un utilisateur correspond à un segment donné.
 */
export async function doesUserMatchSegment(userId: string, segmentId: string): Promise<boolean> {
  const segment = await prisma.audienceSegment.findUnique({
    where: { id: segmentId },
  });

  if (!segment) return false;

  const filters = segment.filters as AudienceFilters;
  return doesUserMatchFilters(userId, filters);
}

/**
 * Vérifie si un utilisateur correspond à des filtres donnés.
 */
export async function doesUserMatchFilters(userId: string, filters: AudienceFilters): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enterpriseAccount: true,
    },
  });

  if (!user) return false;

  // Exclusions explicites
  if (filters.excludeUserIds?.includes(userId)) {
    return false;
  }

  // Vérifier si l'utilisateur est B2C (particulier)
  const isB2C = !user.enterpriseAccountId;

  if (isB2C) {
    // Pour les B2C, on vérifie si includeB2C est activé
    if (!filters.includeB2C) {
      return false;
    }

    // Vérifier les centres d'intérêt
    if (filters.interests?.length) {
      const hasMatchingInterest = user.interests.some((i) =>
        filters.interests!.includes(i)
      );
      if (!hasMatchingInterest) return false;
    }

    // Vérifier le pays
    if (filters.countries?.length && user.pays) {
      if (!filters.countries.includes(user.pays)) return false;
    }

    // Vérifier la région
    if (filters.regions?.length && user.region) {
      if (!filters.regions.includes(user.region)) return false;
    }

    return true;
  }

  // Pour les B2B, on vérifie l'entreprise
  const enterprise = user.enterpriseAccount;
  if (!enterprise) return false;

  // Type d'organisation
  if (filters.organizationTypes?.length) {
    if (!enterprise.organizationType) return false;
    if (!filters.organizationTypes.includes(enterprise.organizationType)) {
      return false;
    }
  }

  // Taille d'organisation
  if (filters.organizationSizes?.length) {
    if (!enterprise.organizationSize) return false;
    if (!filters.organizationSizes.includes(enterprise.organizationSize)) {
      return false;
    }
  }

  // Centres d'intérêt (entreprise)
  if (filters.interests?.length) {
    const hasMatchingInterest = enterprise.interests.some((i) =>
      filters.interests!.includes(i)
    );
    if (!hasMatchingInterest) return false;
  }

  // Pays (via utilisateur ou entreprise si on avait un champ pays entreprise)
  if (filters.countries?.length && user.pays) {
    if (!filters.countries.includes(user.pays)) return false;
  }

  return true;
}

/**
 * Construit la clause WHERE Prisma pour les utilisateurs.
 */
function buildUserWhereClause(filters: AudienceFilters): Prisma.UserWhereInput {
  const conditions: Prisma.UserWhereInput[] = [];

  // Exclure les utilisateurs supprimés
  conditions.push({ deletedAt: null });

  // Exclusions explicites
  if (filters.excludeUserIds?.length) {
    conditions.push({ id: { notIn: filters.excludeUserIds } });
  }

  // Construire les conditions B2C et B2B
  const orConditions: Prisma.UserWhereInput[] = [];

  // Condition B2C (particuliers)
  if (filters.includeB2C) {
    const b2cCondition: Prisma.UserWhereInput = {
      enterpriseAccountId: null,
    };

    // Filtres additionnels pour B2C
    const b2cFilters: Prisma.UserWhereInput[] = [];

    if (filters.interests?.length) {
      b2cFilters.push({ interests: { hasSome: filters.interests } });
    }

    if (filters.countries?.length) {
      b2cFilters.push({ pays: { in: filters.countries } });
    }

    if (filters.regions?.length) {
      b2cFilters.push({ region: { in: filters.regions } });
    }

    if (b2cFilters.length > 0) {
      orConditions.push({
        AND: [b2cCondition, ...b2cFilters],
      });
    } else {
      orConditions.push(b2cCondition);
    }
  }

  // Condition B2B (entreprises)
  if (filters.organizationTypes?.length || filters.organizationSizes?.length) {
    const b2bCondition: Prisma.UserWhereInput = {
      enterpriseAccountId: { not: null },
      enterpriseAccount: {},
    };

    const enterpriseFilters: Prisma.EnterpriseAccountWhereInput = {};

    if (filters.organizationTypes?.length) {
      enterpriseFilters.organizationType = { in: filters.organizationTypes };
    }

    if (filters.organizationSizes?.length) {
      enterpriseFilters.organizationSize = { in: filters.organizationSizes };
    }

    if (filters.interests?.length) {
      enterpriseFilters.interests = { hasSome: filters.interests };
    }

    b2bCondition.enterpriseAccount = enterpriseFilters;

    // Ajouter filtres géo via user
    const geoFilters: Prisma.UserWhereInput[] = [];
    if (filters.countries?.length) {
      geoFilters.push({ pays: { in: filters.countries } });
    }
    if (filters.regions?.length) {
      geoFilters.push({ region: { in: filters.regions } });
    }

    if (geoFilters.length > 0) {
      orConditions.push({
        AND: [b2bCondition, ...geoFilters],
      });
    } else {
      orConditions.push(b2bCondition);
    }
  }

  // Si aucune condition spécifique, on prend tous les utilisateurs avec filtres géo
  if (orConditions.length === 0) {
    if (filters.countries?.length) {
      conditions.push({ pays: { in: filters.countries } });
    }
    if (filters.regions?.length) {
      conditions.push({ region: { in: filters.regions } });
    }
    if (filters.interests?.length) {
      conditions.push({ interests: { hasSome: filters.interests } });
    }
  } else {
    conditions.push({ OR: orConditions });
  }

  return { AND: conditions };
}

/**
 * Récupère les segments auxquels un utilisateur appartient.
 */
export async function getSegmentsForUser(userId: string): Promise<string[]> {
  const segments = await prisma.audienceSegment.findMany({
    where: { isActive: true },
    select: { id: true, filters: true },
  });

  const matchingSegmentIds: string[] = [];

  for (const segment of segments) {
    const filters = segment.filters as AudienceFilters;
    if (await doesUserMatchFilters(userId, filters)) {
      matchingSegmentIds.push(segment.id);
    }
  }

  return matchingSegmentIds;
}
