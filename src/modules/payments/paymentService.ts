import { Prisma, PaymentStatus, SubscriptionSource, SubscriptionStatus, SubscriptionType } from "@prisma/client";
import { addDays } from "date-fns";

import { prisma, ensurePrismaRuntimeMigrations } from "@/lib/config/prisma";
import { logEvent } from "@/modules/logs/loggingService";
import { paymentProvider } from "@/services/payments";

const DEFAULT_CURRENCY = "EUR";
const DEFAULT_DURATION_DAYS = 30;

const prismaReady = ensurePrismaRuntimeMigrations();

export type StartCheckoutParams = {
  userId?: string;
  enterpriseAccountId?: string;
  subscriptionType: SubscriptionType;
  amount: number;
  currency?: string;
  durationDays?: number;
  source?: SubscriptionSource;
  userEmail?: string;
};

export async function startCheckout(params: StartCheckoutParams) {
  await prismaReady;
  if (!params.userId && !params.enterpriseAccountId) {
    throw new Error("userId ou enterpriseAccountId requis");
  }

  const currency = params.currency ?? DEFAULT_CURRENCY;
  const duration = Math.max(params.durationDays ?? DEFAULT_DURATION_DAYS, 1);
  const now = new Date();
  const dateFin = addDays(now, duration);

  if (params.amount <= 0) {
    const subscription = await prisma.subscription.create({
      data: {
        userId: params.userId ?? null,
        enterpriseAccountId: params.enterpriseAccountId ?? null,
        type: params.subscriptionType,
        statut: SubscriptionStatus.ACTIF,
        dateDebut: now,
        dateFin,
        montant: new Prisma.Decimal(0),
        devise: currency,
        source: params.source ?? SubscriptionSource.ONLINE
      }
    });

    await logEvent({
      type: "CREATION_ABONNEMENT",
      userId: params.userId ?? null,
      meta: {
        subscriptionId: subscription.id,
        paymentTransactionId: null,
        statut: PaymentStatus.SUCCES,
        free: true
      }
    });

    return {
      sessionId: null,
      checkoutUrl: null,
      subscriptionId: subscription.id,
      transactionId: null
    };
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: params.userId ?? null,
      enterpriseAccountId: params.enterpriseAccountId ?? null,
      type: params.subscriptionType,
      statut: SubscriptionStatus.SUSPENDU,
      dateDebut: now,
      dateFin,
      montant: new Prisma.Decimal(params.amount),
      devise: currency,
      source: params.source ?? SubscriptionSource.ONLINE
    }
  });

  const session = await paymentProvider.createCheckoutSession({
    reference: subscription.id,
    amount: params.amount,
    currency,
    userEmail: params.userEmail
  });

  const transaction = await prisma.paymentTransaction.create({
    data: {
      userId: params.userId ?? null,
      subscriptionId: subscription.id,
      montant: new Prisma.Decimal(params.amount),
      devise: currency,
      statut: PaymentStatus.EN_ATTENTE,
      referenceExterne: session.sessionId
    }
  });

  await logEvent({
    type: "CREATION_ABONNEMENT",
    userId: params.userId ?? null,
    meta: {
      subscriptionId: subscription.id,
      paymentTransactionId: transaction.id,
      statut: PaymentStatus.EN_ATTENTE
    }
  });

  return {
    sessionId: session.sessionId,
    checkoutUrl: session.checkoutUrl,
    subscriptionId: subscription.id,
    transactionId: transaction.id
  };
}

export async function markPaymentSuccess(params: { sessionId: string; userId?: string }) {
  await prismaReady;
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { referenceExterne: params.sessionId }
  });

  if (!transaction) throw new Error("Session inconnue");
  if (params.userId && transaction.userId && transaction.userId !== params.userId) {
    throw new Error("Session non liée à cet utilisateur");
  }
  if (transaction.statut === PaymentStatus.SUCCES) {
    return { subscriptionId: transaction.subscriptionId };
  }

  const subscription = await prisma.subscription.findUnique({ where: { id: transaction.subscriptionId } });
  if (!subscription) throw new Error("Abonnement introuvable");

  await prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: { statut: PaymentStatus.SUCCES }
    });

    await tx.subscription.update({
      where: { id: transaction.subscriptionId },
      data: { statut: SubscriptionStatus.ACTIF, dateDebut: new Date() }
    });
  });

  await logEvent({
    type: "RENOUVELLEMENT_ABONNEMENT",
    userId: transaction.userId ?? null,
    meta: {
      subscriptionId: transaction.subscriptionId,
      paymentTransactionId: transaction.id,
      sessionId: params.sessionId,
      statut: PaymentStatus.SUCCES
    }
  });

  return { subscriptionId: transaction.subscriptionId };
}

export async function markPaymentFailure(params: { sessionId: string; userId?: string }) {
  await prismaReady;
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { referenceExterne: params.sessionId }
  });

  if (!transaction) throw new Error("Session inconnue");
  if (params.userId && transaction.userId && transaction.userId !== params.userId) {
    throw new Error("Session non liée à cet utilisateur");
  }
  if (transaction.statut === PaymentStatus.ECHEC) {
    return { subscriptionId: transaction.subscriptionId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: { statut: PaymentStatus.ECHEC }
    });

    await tx.subscription.update({
      where: { id: transaction.subscriptionId },
      data: { statut: SubscriptionStatus.SUSPENDU }
    });
  });

  await logEvent({
    type: "AUTRE",
    userId: transaction.userId ?? null,
    meta: {
      context: "PAIEMENT_ECHEC",
      subscriptionId: transaction.subscriptionId,
      paymentTransactionId: transaction.id,
      sessionId: params.sessionId,
      statut: PaymentStatus.ECHEC
    }
  });

  return { subscriptionId: transaction.subscriptionId };
}
