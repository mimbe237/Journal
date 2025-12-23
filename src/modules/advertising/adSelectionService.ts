/**
 * Service de sélection des publicités
 * 
 * Détermine quelle publicité afficher à un utilisateur donné
 * en fonction de ses segments et des campagnes actives.
 */

import { prisma } from "@/lib/config/prisma";
import { AdChannel, AdCampaignStatus } from "@prisma/client";
import { getSegmentsForUser } from "./audienceService";

// Types
export type SelectedAd = {
  campaignId: string;
  creativeId: string;
  imageUrl: string;
  clickUrl: string;
  altText: string | null;
  mjmlSnippet: string | null;
  htmlSnippet: string | null;
  advertiserName: string;
  campaignName: string;
};

export type AdSelectionOptions = {
  userId?: string;
  channel: AdChannel;
  // Pour le tracking
  emailSendId?: string;
};

/**
 * Sélectionne la meilleure publicité pour un utilisateur et un canal donnés.
 * Retourne null si aucune campagne ne correspond.
 */
export async function selectAdForUser(options: AdSelectionOptions): Promise<SelectedAd | null> {
  const { userId, channel } = options;

  // Récupérer les campagnes actives pour ce canal
  const now = new Date();
  const activeCampaigns = await prisma.adCampaign.findMany({
    where: {
      status: AdCampaignStatus.ACTIVE,
      channels: { has: channel },
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: [
      { isExclusive: "desc" },
      { priority: "desc" },
    ],
    include: {
      advertiser: true,
      segments: { select: { segmentId: true } },
      creatives: { where: { isActive: true } },
    },
  });

  if (activeCampaigns.length === 0) {
    return null;
  }

  // Si on a un userId, filtrer par segments
  let userSegmentIds: string[] = [];
  if (userId) {
    userSegmentIds = await getSegmentsForUser(userId);
  }

  // Trouver la meilleure campagne
  for (const campaign of activeCampaigns) {
    // Vérifier les caps
    if (await isCampaignCapped(campaign.id, campaign.dailyCap, campaign.totalCap)) {
      continue;
    }

    // Vérifier si la campagne cible cet utilisateur
    const campaignSegmentIds = campaign.segments.map((s) => s.segmentId);
    
    // Si la campagne n'a pas de segments, elle cible tout le monde
    if (campaignSegmentIds.length === 0) {
      const creative = selectRandomCreative(campaign.creatives);
      if (creative) {
        return {
          campaignId: campaign.id,
          creativeId: creative.id,
          imageUrl: creative.imageUrl,
          clickUrl: creative.clickUrl,
          altText: creative.altText,
          mjmlSnippet: creative.mjmlSnippet,
          htmlSnippet: creative.htmlSnippet,
          advertiserName: campaign.advertiser.nom,
          campaignName: campaign.nom,
        };
      }
    }

    // Vérifier si l'utilisateur est dans un des segments ciblés
    const isTargeted = campaignSegmentIds.some((segId) =>
      userSegmentIds.includes(segId)
    );

    if (isTargeted || !userId) {
      const creative = selectRandomCreative(campaign.creatives);
      if (creative) {
        return {
          campaignId: campaign.id,
          creativeId: creative.id,
          imageUrl: creative.imageUrl,
          clickUrl: creative.clickUrl,
          altText: creative.altText,
          mjmlSnippet: creative.mjmlSnippet,
          htmlSnippet: creative.htmlSnippet,
          advertiserName: campaign.advertiser.nom,
          campaignName: campaign.nom,
        };
      }
    }
  }

  return null;
}

/**
 * Sélectionne une publicité pour un email d'édition.
 * Wrapper pratique pour le cas d'usage email.
 */
export async function selectAdForEditionEmail(userId: string, emailSendId?: string): Promise<SelectedAd | null> {
  return selectAdForUser({
    userId,
    channel: AdChannel.EMAIL_EDITION,
    emailSendId,
  });
}

/**
 * Sélectionne une publicité pour une bannière in-app.
 */
export async function selectAdForInAppBanner(userId: string): Promise<SelectedAd | null> {
  return selectAdForUser({
    userId,
    channel: AdChannel.IN_APP_BANNER,
  });
}

/**
 * Vérifie si une campagne a atteint ses caps d'impressions.
 */
async function isCampaignCapped(
  campaignId: string,
  dailyCap: number | null,
  totalCap: number | null
): Promise<boolean> {
  if (!dailyCap && !totalCap) {
    return false;
  }

  if (totalCap) {
    const totalImpressions = await prisma.adImpression.count({
      where: { campaignId },
    });
    if (totalImpressions >= totalCap) {
      return true;
    }
  }

  if (dailyCap) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyImpressions = await prisma.adImpression.count({
      where: {
        campaignId,
        viewedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
    if (dailyImpressions >= dailyCap) {
      return true;
    }
  }

  return false;
}

/**
 * Sélectionne un créatif au hasard parmi une liste.
 * Pourrait être amélioré avec un système de rotation pondérée.
 */
function selectRandomCreative<T>(creatives: T[]): T | null {
  if (creatives.length === 0) return null;
  const index = Math.floor(Math.random() * creatives.length);
  return creatives[index];
}

/**
 * Génère les tokens de publicité pour le rendu d'email.
 */
export function getAdTokens(ad: SelectedAd | null): Record<string, string | null> {
  if (!ad) {
    return {
      "ad.imageUrl": null,
      "ad.clickUrl": null,
      "ad.altText": null,
      "ad.html": null,
      "ad.mjml": null,
      "ad.advertiser": null,
      "ad.hasAd": "false",
    };
  }

  return {
    "ad.imageUrl": ad.imageUrl,
    "ad.clickUrl": ad.clickUrl,
    "ad.altText": ad.altText,
    "ad.html": ad.htmlSnippet,
    "ad.mjml": ad.mjmlSnippet,
    "ad.advertiser": ad.advertiserName,
    "ad.hasAd": "true",
  };
}

/**
 * Génère le HTML/MJML par défaut si pas de snippet personnalisé.
 */
export function generateAdHtml(ad: SelectedAd): string {
  if (ad.htmlSnippet) {
    return ad.htmlSnippet;
  }

  return `
<div style="text-align: center; padding: 20px 0; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
  <a href="${ad.clickUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img 
      src="${ad.imageUrl}" 
      alt="${ad.altText || "Publicité"}" 
      style="max-width: 100%; height: auto; border-radius: 8px; border: 0;"
    />
  </a>
  <p style="font-size: 10px; color: #6c757d; margin-top: 8px;">Publicité</p>
</div>
`.trim();
}

/**
 * Génère le MJML par défaut si pas de snippet personnalisé.
 */
export function generateAdMjml(ad: SelectedAd): string {
  if (ad.mjmlSnippet) {
    return ad.mjmlSnippet;
  }

  return `
<mj-section padding="20px" background-color="#f8f9fa">
  <mj-column>
    <mj-image 
      src="${ad.imageUrl}" 
      alt="${ad.altText || "Publicité"}" 
      href="${ad.clickUrl}"
      padding="0"
      border-radius="8px"
    />
    <mj-text align="center" font-size="10px" color="#6c757d" padding-top="8px">
      Publicité
    </mj-text>
  </mj-column>
</mj-section>
`.trim();
}
