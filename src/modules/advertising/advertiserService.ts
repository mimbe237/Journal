/**
 * Service de gestion des annonceurs
 */

import { prisma } from "@/lib/config/prisma";
import { Prisma } from "@prisma/client";

// Types
export type CreateAdvertiserInput = {
  nom: string;
  contactEmail: string;
  contactPhone?: string;
  entreprise?: string;
  logoUrl?: string;
  notes?: string;
};

export type UpdateAdvertiserInput = Partial<CreateAdvertiserInput> & {
  isActive?: boolean;
};

export type AdvertiserFilters = {
  isActive?: boolean;
  search?: string;
};

/**
 * Crée un nouvel annonceur.
 */
export async function createAdvertiser(input: CreateAdvertiserInput) {
  return prisma.advertiser.create({
    data: {
      nom: input.nom,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      entreprise: input.entreprise,
      logoUrl: input.logoUrl,
      notes: input.notes,
    },
  });
}

/**
 * Met à jour un annonceur.
 */
export async function updateAdvertiser(id: string, input: UpdateAdvertiserInput) {
  return prisma.advertiser.update({
    where: { id },
    data: input,
  });
}

/**
 * Récupère un annonceur par son ID.
 */
export async function getAdvertiserById(id: string) {
  return prisma.advertiser.findUnique({
    where: { id },
    include: {
      campaigns: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

/**
 * Liste les annonceurs avec filtres optionnels.
 */
export async function listAdvertisers(filters?: AdvertiserFilters) {
  const where: Prisma.AdvertiserWhereInput = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search) {
    where.OR = [
      { nom: { contains: filters.search, mode: "insensitive" } },
      { entreprise: { contains: filters.search, mode: "insensitive" } },
      { contactEmail: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.advertiser.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { campaigns: true },
      },
    },
  });
}

/**
 * Désactive un annonceur (soft delete).
 */
export async function deactivateAdvertiser(id: string) {
  return prisma.advertiser.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Supprime définitivement un annonceur.
 * Attention : supprime aussi toutes les campagnes associées.
 */
export async function deleteAdvertiser(id: string) {
  return prisma.advertiser.delete({
    where: { id },
  });
}
