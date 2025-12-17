import { prisma } from "@/lib/config/prisma";
import { emailProvider } from "@/services/email";
import { EmailSendStatus, EmailTriggerType, Prisma } from "@prisma/client";
import { renderTemplate } from "./templateRenderer";
import { TokenValues, getSampleTokenValues } from "./tokens";

export type SendEmailParams = {
  templateSlug?: string;
  templateId?: string;
  to: string;
  toName?: string;
  userId?: string;
  values: TokenValues;
  locale?: string;
};

/**
 * Envoie un email en utilisant un template de la base de données.
 * Crée un log EmailSend pour le suivi.
 */
export async function sendTemplatedEmail(params: SendEmailParams): Promise<string> {
  const { to, toName, userId, values, locale = "fr" } = params;

  // Récupérer le template
  let template;
  if (params.templateId) {
    template = await prisma.emailTemplate.findUnique({
      where: { id: params.templateId },
      include: { layout: true }
    });
  } else if (params.templateSlug) {
    template = await prisma.emailTemplate.findFirst({
      where: { slug: params.templateSlug, locale, status: "PUBLISHED" },
      include: { layout: true }
    });
  }

  if (!template) {
    throw new Error(`Template non trouvé: ${params.templateSlug || params.templateId}`);
  }

  // Rendre le template
  const rendered = await renderTemplate(template, values);

  // Créer le log d'envoi
  const emailSend = await prisma.emailSend.create({
    data: {
      templateId: template.id,
      recipientEmail: to,
      recipientName: toName,
      userId,
      subject: rendered.subject,
      status: EmailSendStatus.PENDING,
      metadata: values as Prisma.InputJsonValue
    }
  });

  try {
    // Envoyer via le provider
    await emailProvider.sendEmail({
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text ?? undefined
    });

    // Mettre à jour le statut
    await prisma.emailSend.update({
      where: { id: emailSend.id },
      data: {
        status: EmailSendStatus.SENT,
        sentAt: new Date()
      }
    });

    return emailSend.id;
  } catch (error: any) {
    // Marquer comme échoué
    await prisma.emailSend.update({
      where: { id: emailSend.id },
      data: {
        status: EmailSendStatus.FAILED,
        failedAt: new Date(),
        errorMessage: error?.message || "Erreur inconnue"
      }
    });
    throw error;
  }
}

/**
 * Envoie un email de test (prévisualisation).
 */
export async function sendTestEmail(params: {
  templateId: string;
  testEmail: string;
  customValues?: TokenValues;
}): Promise<string> {
  const values = params.customValues || getSampleTokenValues();
  return sendTemplatedEmail({
    templateId: params.templateId,
    to: params.testEmail,
    values
  });
}

/**
 * Déclenche les automatisations pour un événement donné.
 */
export async function triggerEmailAutomation(params: {
  triggerType: EmailTriggerType;
  userId?: string;
  recipientEmail: string;
  recipientName?: string;
  values: TokenValues;
}): Promise<void> {
  const automations = await prisma.emailAutomation.findMany({
    where: {
      triggerType: params.triggerType,
      active: true
    },
    include: { template: { include: { layout: true } } }
  });

  for (const automation of automations) {
    // TODO: implémenter le délai (delayMinutes) via une queue
    if (automation.delayMinutes > 0) {
      console.log(`[email-automation] Delayed send scheduled for ${automation.delayMinutes} minutes`);
      // Pour l'instant, on envoie immédiatement
    }

    try {
      await sendTemplatedEmail({
        templateId: automation.templateId,
        to: params.recipientEmail,
        toName: params.recipientName,
        userId: params.userId,
        values: params.values
      });
    } catch (error) {
      console.error(`[email-automation] Failed to send for automation ${automation.id}:`, error);
    }
  }
}

/**
 * Statistiques d'envoi pour le dashboard.
 */
export async function getEmailStats(params?: {
  templateId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}> {
  const where: Prisma.EmailSendWhereInput = {};
  
  if (params?.templateId) {
    where.templateId = params.templateId;
  }
  if (params?.startDate || params?.endDate) {
    where.createdAt = {};
    if (params.startDate) where.createdAt.gte = params.startDate;
    if (params.endDate) where.createdAt.lte = params.endDate;
  }

  const [total, sent, delivered, opened, clicked, bounced, failed] = await Promise.all([
    prisma.emailSend.count({ where }),
    prisma.emailSend.count({ where: { ...where, status: EmailSendStatus.SENT } }),
    prisma.emailSend.count({ where: { ...where, status: EmailSendStatus.DELIVERED } }),
    prisma.emailSend.count({ where: { ...where, status: EmailSendStatus.OPENED } }),
    prisma.emailSend.count({ where: { ...where, status: EmailSendStatus.CLICKED } }),
    prisma.emailSend.count({ where: { ...where, status: EmailSendStatus.BOUNCED } }),
    prisma.emailSend.count({ where: { ...where, status: EmailSendStatus.FAILED } })
  ]);

  const deliveredTotal = delivered + opened + clicked;
  const openRate = deliveredTotal > 0 ? (opened + clicked) / deliveredTotal * 100 : 0;
  const clickRate = (opened + clicked) > 0 ? clicked / (opened + clicked) * 100 : 0;
  const bounceRate = total > 0 ? bounced / total * 100 : 0;

  return {
    total,
    sent,
    delivered: deliveredTotal,
    opened,
    clicked,
    bounced,
    failed,
    openRate: Math.round(openRate * 10) / 10,
    clickRate: Math.round(clickRate * 10) / 10,
    bounceRate: Math.round(bounceRate * 10) / 10
  };
}
