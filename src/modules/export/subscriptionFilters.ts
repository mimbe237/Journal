import { Prisma, SubscriptionStatus } from "@prisma/client";

export type SubscriptionFilterInput = {
  status?: string;
  startDate?: string;
  endDate?: string;
  subscriberType?: "all" | "individual" | "enterprise";
};

export function buildSubscriptionWhere(filters: SubscriptionFilterInput): Prisma.SubscriptionWhereInput {
  const {
    status = "all",
    startDate,
    endDate,
    subscriberType = "all",
  } = filters || {};

  const where: Prisma.SubscriptionWhereInput = {};

  if (status !== "all") {
    where.statut = status as SubscriptionStatus;
  }
  if (startDate) {
    const d = new Date(startDate);
    if (!Number.isNaN(d.getTime())) {
      where.dateDebut = { gte: d };
    }
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!Number.isNaN(d.getTime())) {
      where.dateFin = { lte: d };
    }
  }

  if (subscriberType === "individual") {
    where.userId = { not: null };
    where.enterpriseAccountId = null;
  } else if (subscriberType === "enterprise") {
    where.enterpriseAccountId = { not: null };
  }

  return where;
}
