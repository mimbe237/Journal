import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { emailProvider } from "@/services/email";

export interface ISmsProvider {
  sendSms(params: { to: string; message: string }): Promise<void>;
}

// Implémentation fictive SMS. TODO: brancher Twilio/MessageBird/etc.
class ConsoleSmsProvider implements ISmsProvider {
  async sendSms(params: { to: string; message: string }): Promise<void> {
    // eslint-disable-next-line no-console
    console.info("[SMS]", params);
  }
}

const smsProvider: ISmsProvider = new ConsoleSmsProvider();

/**
 * Envoie un email d'alerte d'expiration d'abonnement.
 */
export async function sendSubscriptionExpiryEmail(params: {
  userEmail: string;
  userName?: string | null;
  daysBefore: number;
  dateFin: Date;
}): Promise<void> {
  const subject = `[Journal] Votre abonnement expire dans ${params.daysBefore} jour${params.daysBefore > 1 ? "s" : ""}`;
  const dateFinLocale = format(params.dateFin, "PPP", { locale: fr });
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
      <h2 style="color:#0f172a;">Bonjour ${params.userName ?? ""}</h2>
      <p>Votre abonnement au journal arrive à expiration dans ${params.daysBefore} jour${
    params.daysBefore > 1 ? "s" : ""
  }.</p>
      <p>Date d'expiration : <strong>${dateFinLocale}</strong></p>
      <p>Pour éviter toute interruption, pensez à renouveler votre abonnement dès maintenant.</p>
      <p style="margin-top: 16px;">
        <a href="#" style="background:#10b981;color:#0f172a;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">
          Renouveler mon abonnement
        </a>
      </p>
      <p style="color:#475569;font-size:14px;">Si vous avez déjà renouvelé, ignorez ce message.</p>
    </div>
  `;

  await emailProvider.sendEmail({
    to: params.userEmail,
    subject,
    html: htmlBody,
  });
}

export async function sendManualSubscriptionReceivedEmail(params: {
  submissionId: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
}): Promise<void> {
  // TODO: Récupérer les emails des admins FACTURATION depuis la DB ou config
  const adminEmail = "facturation@journal.com"; 
  
  const subject = `[Admin] Nouvelle soumission d'abonnement : ${params.userName}`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Nouvelle demande d'abonnement</h2>
      <p><strong>Utilisateur :</strong> ${params.userName} (${params.userEmail})</p>
      <p><strong>Montant :</strong> ${params.amount} ${params.currency}</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/facturation/soumissions">
          Voir la demande
        </a>
      </p>
    </div>
  `;

  await emailProvider.sendEmail({
    to: adminEmail,
    subject,
    html
  });
}

export async function sendManualSubscriptionApprovedEmail(params: {
  userEmail: string;
  userName: string;
}): Promise<void> {
  const subject = `[Journal] Votre abonnement a été validé`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Félicitations ${params.userName} !</h2>
      <p>Votre demande d'abonnement a été validée par notre équipe.</p>
      <p>Vous avez désormais accès à toutes les éditions.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard">
          Accéder à mon espace
        </a>
      </p>
    </div>
  `;

  await emailProvider.sendEmail({
    to: params.userEmail,
    subject,
    html
  });
}

export async function sendManualSubscriptionRejectedEmail(params: {
  userEmail: string;
  userName: string;
  reason: string;
}): Promise<void> {
  const subject = `[Journal] Problème avec votre demande d'abonnement`;
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Bonjour ${params.userName},</h2>
      <p>Votre demande d'abonnement n'a pas pu être validée pour la raison suivante :</p>
      <blockquote style="background: #f1f5f9; padding: 10px; border-left: 4px solid #ef4444;">
        ${params.reason}
      </blockquote>
      <p>Merci de vérifier vos informations ou de nous contacter.</p>
    </div>
  `;

  await emailProvider.sendEmail({
    to: params.userEmail,
    subject,
    html
  });
}


/**
 * Envoie un SMS d'alerte d'expiration d'abonnement (stub).
 * TODO: ajouter un champ phoneNumber côté User et brancher un vrai provider SMS.
 */
export async function sendSubscriptionExpirySms(params: {
  phoneNumber: string;
  daysBefore: number;
  dateFin: Date;
}): Promise<void> {
  const dateFinLocale = format(params.dateFin, "dd/MM/yyyy", { locale: fr });
  const message = `Votre abonnement au journal expire dans ${params.daysBefore} jour${
    params.daysBefore > 1 ? "s" : ""
  } (date : ${dateFinLocale}). Pensez au renouvellement.`;
  await smsProvider.sendSms({ to: params.phoneNumber, message });
}
