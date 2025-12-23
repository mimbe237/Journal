/**
 * Service de reporting publicitaire
 * 
 * Génère des rapports de performance pour les campagnes publicitaires.
 */

import { prisma } from "@/lib/config/prisma";
import { AdChannel } from "@prisma/client";
import {
  getImpressionCount,
  getClickCount,
  getImpressionsByDay,
  getClicksByDay,
} from "./trackingService";

// Types
export type CampaignReport = {
  campaignId: string;
  campaignName: string;
  advertiserName: string;
  status: string;
  startDate: Date;
  endDate: Date;
  // Métriques globales
  totalImpressions: number;
  totalClicks: number;
  ctr: number; // Click-through rate (%)
  // Par canal
  byChannel: {
    channel: AdChannel;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  // Par créatif
  byCreative: {
    creativeId: string;
    creativeName: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  // Série temporelle
  dailyStats: {
    date: string;
    impressions: number;
    clicks: number;
  }[];
};

export type AdvertiserReport = {
  advertiserId: string;
  advertiserName: string;
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalCtr: number;
  totalBudget: number;
  campaigns: {
    id: string;
    nom: string;
    status: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
};

export type GlobalAdStats = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalAdvertisers: number;
  totalImpressions: number;
  totalClicks: number;
  averageCtr: number;
  topCampaigns: {
    id: string;
    nom: string;
    advertiser: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
};

/**
 * Génère un rapport complet pour une campagne.
 */
export async function getCampaignReport(campaignId: string): Promise<CampaignReport | null> {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: {
      advertiser: true,
      creatives: true,
    },
  });

  if (!campaign) return null;

  // Métriques globales
  const totalImpressions = await getImpressionCount(campaignId);
  const totalClicks = await getClickCount(campaignId);
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Par canal
  const channels = [AdChannel.EMAIL_EDITION, AdChannel.EMAIL_NEWSLETTER, AdChannel.IN_APP_BANNER];
  const byChannel = await Promise.all(
    channels.map(async (channel) => {
      const impressions = await prisma.adImpression.count({
        where: { campaignId, channel },
      });
      const clicks = await prisma.adClick.count({
        where: { campaignId, channel },
      });
      return {
        channel,
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    })
  );

  // Par créatif
  const byCreative = await Promise.all(
    campaign.creatives.map(async (creative) => {
      const impressions = await getImpressionCount(campaignId, creative.id);
      const clicks = await getClickCount(campaignId, creative.id);
      return {
        creativeId: creative.id,
        creativeName: creative.nom,
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      };
    })
  );

  // Série temporelle (derniers 30 jours ou durée de la campagne)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const impressionsByDay = await getImpressionsByDay(campaignId, startDate, endDate);
  const clicksByDay = await getClicksByDay(campaignId, startDate, endDate);

  // Fusionner les données par jour
  const dailyMap: Record<string, { impressions: number; clicks: number }> = {};
  for (const { date, count } of impressionsByDay) {
    dailyMap[date] = { impressions: count, clicks: 0 };
  }
  for (const { date, count } of clicksByDay) {
    if (dailyMap[date]) {
      dailyMap[date].clicks = count;
    } else {
      dailyMap[date] = { impressions: 0, clicks: count };
    }
  }

  const dailyStats = Object.entries(dailyMap)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    campaignId: campaign.id,
    campaignName: campaign.nom,
    advertiserName: campaign.advertiser.nom,
    status: campaign.status,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    totalImpressions,
    totalClicks,
    ctr: Math.round(ctr * 100) / 100,
    byChannel: byChannel.map((c) => ({
      ...c,
      ctr: Math.round(c.ctr * 100) / 100,
    })),
    byCreative: byCreative.map((c) => ({
      ...c,
      ctr: Math.round(c.ctr * 100) / 100,
    })),
    dailyStats,
  };
}

/**
 * Génère un rapport pour un annonceur.
 */
export async function getAdvertiserReport(advertiserId: string): Promise<AdvertiserReport | null> {
  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    include: {
      campaigns: true,
    },
  });

  if (!advertiser) return null;

  const campaignStats = await Promise.all(
    advertiser.campaigns.map(async (campaign) => {
      const impressions = await getImpressionCount(campaign.id);
      const clicks = await getClickCount(campaign.id);
      return {
        id: campaign.id,
        nom: campaign.nom,
        status: campaign.status,
        impressions,
        clicks,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
      };
    })
  );

  const totalImpressions = campaignStats.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = campaignStats.reduce((sum, c) => sum + c.clicks, 0);
  const activeCampaigns = advertiser.campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalBudget = advertiser.campaigns.reduce(
    (sum, c) => sum + (c.budget ? Number(c.budget) : 0),
    0
  );

  return {
    advertiserId: advertiser.id,
    advertiserName: advertiser.nom,
    totalCampaigns: advertiser.campaigns.length,
    activeCampaigns,
    totalImpressions,
    totalClicks,
    totalCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    totalBudget,
    campaigns: campaignStats,
  };
}

/**
 * Génère des statistiques globales pour le tableau de bord admin.
 */
export async function getGlobalAdStats(): Promise<GlobalAdStats> {
  const [
    totalCampaigns,
    activeCampaigns,
    totalAdvertisers,
    totalImpressions,
    totalClicks,
  ] = await Promise.all([
    prisma.adCampaign.count(),
    prisma.adCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.advertiser.count({ where: { isActive: true } }),
    prisma.adImpression.count(),
    prisma.adClick.count(),
  ]);

  // Top 5 campagnes par impressions
  const campaignsWithStats = await prisma.adCampaign.findMany({
    include: {
      advertiser: true,
      _count: {
        select: { impressions: true, clicks: true },
      },
    },
    orderBy: {
      impressions: { _count: "desc" },
    },
    take: 5,
  });

  const topCampaigns = campaignsWithStats.map((c) => ({
    id: c.id,
    nom: c.nom,
    advertiser: c.advertiser.nom,
    impressions: c._count.impressions,
    clicks: c._count.clicks,
    ctr:
      c._count.impressions > 0
        ? Math.round((c._count.clicks / c._count.impressions) * 10000) / 100
        : 0,
  }));

  return {
    totalCampaigns,
    activeCampaigns,
    totalAdvertisers,
    totalImpressions,
    totalClicks,
    averageCtr:
      totalImpressions > 0
        ? Math.round((totalClicks / totalImpressions) * 10000) / 100
        : 0,
    topCampaigns,
  };
}

/**
 * Exporte un rapport de campagne au format CSV.
 */
export function exportCampaignReportToCsv(report: CampaignReport): string {
  const lines: string[] = [];

  // En-tête
  lines.push("Rapport de campagne publicitaire");
  lines.push(`Campagne: ${report.campaignName}`);
  lines.push(`Annonceur: ${report.advertiserName}`);
  lines.push(`Statut: ${report.status}`);
  lines.push(`Période: ${report.startDate.toLocaleDateString()} - ${report.endDate.toLocaleDateString()}`);
  lines.push("");

  // Métriques globales
  lines.push("MÉTRIQUES GLOBALES");
  lines.push(`Impressions totales: ${report.totalImpressions}`);
  lines.push(`Clics totaux: ${report.totalClicks}`);
  lines.push(`Taux de clic (CTR): ${report.ctr}%`);
  lines.push("");

  // Par canal
  lines.push("PAR CANAL");
  lines.push("Canal,Impressions,Clics,CTR (%)");
  for (const channel of report.byChannel) {
    lines.push(`${channel.channel},${channel.impressions},${channel.clicks},${channel.ctr}`);
  }
  lines.push("");

  // Par créatif
  lines.push("PAR CRÉATIF");
  lines.push("Créatif,Impressions,Clics,CTR (%)");
  for (const creative of report.byCreative) {
    lines.push(`${creative.creativeName},${creative.impressions},${creative.clicks},${creative.ctr}`);
  }
  lines.push("");

  // Données quotidiennes
  lines.push("DONNÉES QUOTIDIENNES");
  lines.push("Date,Impressions,Clics");
  for (const day of report.dailyStats) {
    lines.push(`${day.date},${day.impressions},${day.clicks}`);
  }

  return lines.join("\n");
}
