/**
 * Service de tracking des publicités
 * 
 * Gère l'enregistrement des impressions et clics publicitaires.
 */

import { prisma } from "@/lib/config/prisma";
import { AdChannel, Prisma } from "@prisma/client";

// Types
export type RecordImpressionInput = {
  campaignId: string;
  creativeId: string;
  userId?: string;
  channel: AdChannel;
  emailSendId?: string;
  metadata?: Record<string, unknown>;
};

export type RecordClickInput = {
  campaignId: string;
  creativeId: string;
  userId?: string;
  channel: AdChannel;
  emailSendId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Enregistre une impression publicitaire.
 */
export async function recordImpression(input: RecordImpressionInput) {
  return prisma.adImpression.create({
    data: {
      campaignId: input.campaignId,
      creativeId: input.creativeId,
      userId: input.userId,
      channel: input.channel,
      emailSendId: input.emailSendId,
      metadata: input.metadata as Prisma.InputJsonValue,
    },
  });
}

/**
 * Enregistre un clic publicitaire.
 */
export async function recordClick(input: RecordClickInput) {
  return prisma.adClick.create({
    data: {
      campaignId: input.campaignId,
      creativeId: input.creativeId,
      userId: input.userId,
      channel: input.channel,
      emailSendId: input.emailSendId,
      metadata: input.metadata as Prisma.InputJsonValue,
    },
  });
}

/**
 * Enregistre une impression lors de l'envoi d'un email avec pub.
 * À appeler depuis emailService lors de l'envoi.
 */
export async function recordEmailAdImpression(
  campaignId: string,
  creativeId: string,
  userId: string,
  emailSendId: string
) {
  return recordImpression({
    campaignId,
    creativeId,
    userId,
    channel: AdChannel.EMAIL_EDITION,
    emailSendId,
  });
}

/**
 * Enregistre un clic depuis un email (appelé via webhook ou pixel).
 */
export async function recordEmailAdClick(
  campaignId: string,
  creativeId: string,
  userId: string,
  emailSendId?: string
) {
  return recordClick({
    campaignId,
    creativeId,
    userId,
    channel: AdChannel.EMAIL_EDITION,
    emailSendId,
  });
}

/**
 * Enregistre une impression de bannière in-app.
 */
export async function recordInAppImpression(
  campaignId: string,
  creativeId: string,
  userId: string
) {
  return recordImpression({
    campaignId,
    creativeId,
    userId,
    channel: AdChannel.IN_APP_BANNER,
  });
}

/**
 * Enregistre un clic sur une bannière in-app.
 */
export async function recordInAppClick(
  campaignId: string,
  creativeId: string,
  userId: string
) {
  return recordClick({
    campaignId,
    creativeId,
    userId,
    channel: AdChannel.IN_APP_BANNER,
  });
}

/**
 * Récupère le nombre total d'impressions pour une campagne.
 */
export async function getImpressionCount(campaignId: string, creativeId?: string) {
  return prisma.adImpression.count({
    where: {
      campaignId,
      creativeId: creativeId || undefined,
    },
  });
}

/**
 * Récupère le nombre total de clics pour une campagne.
 */
export async function getClickCount(campaignId: string, creativeId?: string) {
  return prisma.adClick.count({
    where: {
      campaignId,
      creativeId: creativeId || undefined,
    },
  });
}

/**
 * Récupère les impressions pour une période donnée.
 */
export async function getImpressionsByDateRange(
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.adImpression.findMany({
    where: {
      campaignId,
      viewedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { viewedAt: "desc" },
  });
}

/**
 * Récupère les clics pour une période donnée.
 */
export async function getClicksByDateRange(
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  return prisma.adClick.findMany({
    where: {
      campaignId,
      clickedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { clickedAt: "desc" },
  });
}

/**
 * Compte les impressions groupées par jour.
 */
export async function getImpressionsByDay(
  campaignId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; count: number }[]> {
  const impressions = await prisma.adImpression.groupBy({
    by: ["viewedAt"],
    where: {
      campaignId,
      viewedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
  });

  // Regrouper par jour
  const byDay: Record<string, number> = {};
  for (const imp of impressions) {
    const day = imp.viewedAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] || 0) + imp._count.id;
  }

  return Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compte les clics groupés par jour.
 */
export async function getClicksByDay(
  campaignId: string,
  startDate: Date,
  endDate: Date
): Promise<{ date: string; count: number }[]> {
  const clicks = await prisma.adClick.groupBy({
    by: ["clickedAt"],
    where: {
      campaignId,
      clickedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: { id: true },
  });

  // Regrouper par jour
  const byDay: Record<string, number> = {};
  for (const click of clicks) {
    const day = click.clickedAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] || 0) + click._count.id;
  }

  return Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
