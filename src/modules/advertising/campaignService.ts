/**
 * Service de gestion des campagnes publicitaires
 */

import { prisma } from "@/lib/config/prisma";
import { AdCampaignStatus, AdChannel, Prisma } from "@prisma/client";

// Types
export type CreateCampaignInput = {
  nom: string;
  advertiserId: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  currency?: string;
  priority?: number;
  channels: AdChannel[];
  isExclusive?: boolean;
  dailyCap?: number;
  totalCap?: number;
  segmentIds?: string[];
};

export type UpdateCampaignInput = Partial<Omit<CreateCampaignInput, "advertiserId">> & {
  status?: AdCampaignStatus;
};

export type CampaignFilters = {
  status?: AdCampaignStatus | AdCampaignStatus[];
  advertiserId?: string;
  channel?: AdChannel;
  dateRange?: { start: Date; end: Date };
};

/**
 * Crée une nouvelle campagne publicitaire.
 */
export async function createCampaign(input: CreateCampaignInput) {
  const { segmentIds, ...campaignData } = input;

  return prisma.adCampaign.create({
    data: {
      nom: campaignData.nom,
      advertiserId: campaignData.advertiserId,
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      budget: campaignData.budget,
      currency: campaignData.currency || "XAF",
      priority: campaignData.priority || 0,
      channels: campaignData.channels,
      isExclusive: campaignData.isExclusive || false,
      dailyCap: campaignData.dailyCap,
      totalCap: campaignData.totalCap,
      status: AdCampaignStatus.DRAFT,
      segments: segmentIds?.length
        ? {
            create: segmentIds.map((segmentId) => ({
              segmentId,
            })),
          }
        : undefined,
    },
    include: {
      advertiser: true,
      segments: { include: { segment: true } },
      creatives: true,
    },
  });
}

/**
 * Met à jour une campagne.
 */
export async function updateCampaign(id: string, input: UpdateCampaignInput) {
  const { segmentIds, ...updateData } = input;

  // Si on met à jour les segments, on doit d'abord les supprimer
  if (segmentIds !== undefined) {
    await prisma.adCampaignSegment.deleteMany({
      where: { campaignId: id },
    });

    if (segmentIds.length > 0) {
      await prisma.adCampaignSegment.createMany({
        data: segmentIds.map((segmentId) => ({
          campaignId: id,
          segmentId,
        })),
      });
    }
  }

  return prisma.adCampaign.update({
    where: { id },
    data: updateData,
    include: {
      advertiser: true,
      segments: { include: { segment: true } },
      creatives: true,
    },
  });
}

/**
 * Récupère une campagne par son ID.
 */
export async function getCampaignById(id: string) {
  return prisma.adCampaign.findUnique({
    where: { id },
    include: {
      advertiser: true,
      segments: { include: { segment: true } },
      creatives: true,
      _count: {
        select: { impressions: true, clicks: true },
      },
    },
  });
}

/**
 * Liste les campagnes avec filtres.
 */
export async function listCampaigns(filters?: CampaignFilters) {
  const where: Prisma.AdCampaignWhereInput = {};

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status };
    } else {
      where.status = filters.status;
    }
  }

  if (filters?.advertiserId) {
    where.advertiserId = filters.advertiserId;
  }

  if (filters?.channel) {
    where.channels = { has: filters.channel };
  }

  if (filters?.dateRange) {
    where.AND = [
      { startDate: { lte: filters.dateRange.end } },
      { endDate: { gte: filters.dateRange.start } },
    ];
  }

  return prisma.adCampaign.findMany({
    where,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    include: {
      advertiser: true,
      segments: { include: { segment: true } },
      _count: {
        select: { creatives: true, impressions: true, clicks: true },
      },
    },
  });
}

/**
 * Liste les campagnes actives pour un canal donné.
 */
export async function getActiveCampaignsForChannel(channel: AdChannel) {
  const now = new Date();

  return prisma.adCampaign.findMany({
    where: {
      status: AdCampaignStatus.ACTIVE,
      channels: { has: channel },
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: [{ isExclusive: "desc" }, { priority: "desc" }],
    include: {
      segments: { include: { segment: true } },
      creatives: { where: { isActive: true } },
    },
  });
}

/**
 * Change le statut d'une campagne.
 */
export async function updateCampaignStatus(id: string, status: AdCampaignStatus) {
  return prisma.adCampaign.update({
    where: { id },
    data: { status },
  });
}

/**
 * Active une campagne (passe de DRAFT/SCHEDULED à ACTIVE).
 */
export async function activateCampaign(id: string) {
  return updateCampaignStatus(id, AdCampaignStatus.ACTIVE);
}

/**
 * Met en pause une campagne.
 */
export async function pauseCampaign(id: string) {
  return updateCampaignStatus(id, AdCampaignStatus.PAUSED);
}

/**
 * Annule une campagne.
 */
export async function cancelCampaign(id: string) {
  return updateCampaignStatus(id, AdCampaignStatus.CANCELLED);
}

/**
 * Supprime une campagne.
 */
export async function deleteCampaign(id: string) {
  return prisma.adCampaign.delete({
    where: { id },
  });
}
