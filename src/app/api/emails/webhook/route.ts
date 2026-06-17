import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { EmailSendStatus } from '@prisma/client';

/**
 * Webhook Resend pour les événements email
 * Documentation: https://resend.com/docs/dashboard/webhooks/introduction
 * 
 * Événements supportés:
 * - email.sent
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 * - email.delivery_delayed
 */

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: {
      link: string;
      timestamp: string;
    };
    bounce?: {
      message: string;
    };
    complaint?: {
      complaint_type: string;
    };
  };
}

// Mapping des types d'événements Resend vers nos statuts
const EVENT_STATUS_MAP: Record<string, EmailSendStatus> = {
  'email.sent': 'SENT',
  'email.delivered': 'DELIVERED',
  'email.opened': 'OPENED',
  'email.clicked': 'CLICKED',
  'email.bounced': 'BOUNCED',
  'email.complained': 'COMPLAINED',
};

export async function POST(req: NextRequest) {
  try {
    // Vérifier la signature webhook (optionnel mais recommandé)
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('svix-signature');
      const timestamp = req.headers.get('svix-timestamp');
      const id = req.headers.get('svix-id');

      if (!signature || !timestamp || !id) {
        console.warn('[Resend Webhook] Missing signature headers');
        // En production, vous devriez rejeter la requête
        // return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      // TODO: Implémenter la vérification de signature avec svix
      // const wh = new Webhook(webhookSecret);
      // wh.verify(await req.text(), { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': signature });
    }

    const payload: ResendWebhookPayload = await req.json();
    const { type, data } = payload;

    console.log(`[Resend Webhook] Received event: ${type} for email ${data.email_id}`);

    // Trouver l'envoi par providerMessageId
    const emailSend = await prisma.emailSend.findFirst({
      where: { providerMessageId: data.email_id },
    });

    if (!emailSend) {
      console.warn(`[Resend Webhook] No EmailSend found for provider ID: ${data.email_id}`);
      // On retourne 200 quand même pour éviter les retry
      return NextResponse.json({ received: true, matched: false });
    }

    const now = new Date();
    const newStatus = EVENT_STATUS_MAP[type];

    // Créer l'événement
    await prisma.emailEvent.create({
      data: {
        sendId: emailSend.id,
        type: type,
        occurredAt: now,
        metadata: JSON.parse(JSON.stringify(data)),
      },
    });

    // Mettre à jour l'envoi selon le type d'événement
    const updateData: Record<string, unknown> = {};

    switch (type) {
      case 'email.sent':
        updateData.sentAt = now;
        updateData.status = newStatus;
        break;

      case 'email.delivered':
        updateData.deliveredAt = now;
        updateData.status = newStatus;
        break;

      case 'email.opened':
        // Ne mettre à jour openedAt que la première fois
        if (!emailSend.openedAt) {
          updateData.openedAt = now;
        }
        // Mettre à jour le statut seulement si pas déjà cliqué
        if (emailSend.status !== 'CLICKED') {
          updateData.status = newStatus;
        }
        break;

      case 'email.clicked':
        if (!emailSend.clickedAt) {
          updateData.clickedAt = now;
        }
        updateData.status = newStatus;
        break;

      case 'email.bounced':
        updateData.bouncedAt = now;
        updateData.status = newStatus;
        updateData.errorMessage = data.bounce?.message || 'Email bounced';
        break;

      case 'email.complained':
        updateData.status = 'COMPLAINED';
        updateData.errorMessage = `Complaint: ${data.complaint?.complaint_type || 'spam'}`;
        break;

      case 'email.delivery_delayed':
        // Juste logger, ne pas changer le statut
        console.log(`[Resend Webhook] Delivery delayed for ${data.email_id}`);
        break;

      default:
        console.log(`[Resend Webhook] Unhandled event type: ${type}`);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.emailSend.update({
        where: { id: emailSend.id },
        data: updateData,
      });
    }

    return NextResponse.json({ 
      received: true, 
      matched: true,
      event: type,
      emailSendId: emailSend.id 
    });

  } catch (error) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    // Retourner 200 même en cas d'erreur pour éviter les retry infinies
    return NextResponse.json(
      { error: 'Internal error', received: true },
      { status: 200 }
    );
  }
}

// GET pour vérifier que le webhook est accessible
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Resend Email Webhook',
    supportedEvents: Object.keys(EVENT_STATUS_MAP),
  });
}
