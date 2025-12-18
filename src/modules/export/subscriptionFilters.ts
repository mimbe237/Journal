import { Prisma, SubscriptionSource, SubscriptionStatus } from "@prisma/client";

export type SubscriptionFilterInput = {
  status?: string;
  startDate?: string;
  endDate?: string;
  subscriberType?: "all" | "individual" | "enterprise";
  enterpriseId?: string;
  journalTypeId?: string;
  source?: "all" | "OFFLINE" | "ONLINE";
  currency?: string;
  hasPromo?: boolean;
  subscriptionType?: string;
};

export function buildSubscriptionWhere(filters: SubscriptionFilterInput): Prisma.SubscriptionWhereInput {
  const {
    status = "all",
    startDate,
    endDate,
    subscriberType = "all",
    enterpriseId,
    journalTypeId,
    source = "all",
    currency,
    hasPromo,
    subscriptionType
  } = filters || {};

  const where: Prisma.SubscriptionWhereInput = {};

  if (status && status !== "all") {
    where.statut = status as SubscriptionStatus;
  }

  const dateFilters: Prisma.SubscriptionWhereInput["dateDebut"] = {};
  if (startDate) {
    const d = new Date(startDate);
    if (!Number.isNaN(d.getTime())) {
      dateFilters.gte = d;
    }
  }
  if (endDate) {
    const d = new Date(endDate);
    if (!Number.isNaN(d.getTime())) {
      dateFilters.lte = d;
    }
  }
  if (Object.keys(dateFilters).length) {
    where.dateDebut = dateFilters;
  }

  if (subscriberType === "individual") {
    where.userId = { not: null };
    where.enterpriseAccountId = null;
  } else if (subscriberType === "enterprise") {
    where.enterpriseAccountId = { not: null };
  }

  if (enterpriseId) {
    where.enterpriseAccountId = enterpriseId;
  }

  if (journalTypeId) {
    where.journalTypeId = journalTypeId;
  }

  if (subscriptionType) {
    where.type = subscriptionType as any;
  }

  if (source && source !== "all") {
    where.source = source as SubscriptionSource;
  }

  if (currency) {
    where.devise = currency.toUpperCase();
  }

  if (hasPromo === true) {
    where.promoCodeId = { not: null };
  } else if (hasPromo === false) {
    where.promoCodeId = null;
  }

  return where;
}
