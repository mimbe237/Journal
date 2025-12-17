/**
 * Seed script pour les templates email par défaut
 * 
 * Usage: npx ts-node prisma/seeds/seedEmailTemplates.ts
 * 
 * Ce script crée :
 * - 1 layout principal (default-layout)
 * - 14 templates email par défaut
 * - Les automations associées
 */

import { PrismaClient, EmailTriggerType, EmailCategory, EmailTemplateStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Layout HTML par défaut
const DEFAULT_LAYOUT_MJML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #0f172a;
      background-color: #f1f5f9;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      background: #10b981;
      color: white !important;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #059669;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 12px;
    }
    .footer a {
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📰 Journal</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>© 2024 Journal. Tous droits réservés.</p>
      <p>
        <a href="{{app.url}}/profile/notifications">Gérer mes notifications</a> |
        <a href="{{app.url}}/faq">FAQ</a> |
        <a href="{{app.url}}/support">Support</a>
      </p>
    </div>
  </div>
</body>
</html>`;

// Définition des templates
interface TemplateDefinition {
  slug: string;
  nom: string;
  description: string;
  category: EmailCategory;
  sujet: string;
  corps: string;
  corpsText: string;
  tokens: Record<string, string>;
  automation?: {
    triggerType: EmailTriggerType;
    nom: string;
    description: string;
    delayMinutes?: number;
  };
}

const TEMPLATES: TemplateDefinition[] = [
  // 1. Welcome
  {
    slug: 'welcome',
    nom: 'Bienvenue',
    description: 'Email de bienvenue envoyé après inscription',
    category: 'TRANSACTIONAL',
    sujet: 'Bienvenue sur Journal, {{user.prenom}} ! 🎉',
    corps: `<h2>Bienvenue {{user.prenom}} ! 👋</h2>

<p>Nous sommes ravis de vous accueillir sur <strong>Journal</strong>, votre plateforme de lecture d'éditions numériques.</p>

<p>Votre compte a été créé avec succès. Voici ce que vous pouvez faire maintenant :</p>

<ul>
  <li>📖 <strong>Découvrir les éditions</strong> disponibles</li>
  <li>💳 <strong>Souscrire à un abonnement</strong> pour un accès illimité</li>
  <li>👤 <strong>Compléter votre profil</strong></li>
</ul>

<p style="text-align: center;">
  <a href="{{app.url}}/dashboard" class="button">Accéder à mon espace</a>
</p>

<p>Des questions ? Notre équipe support est là pour vous aider.</p>

<p>À très bientôt,<br>L'équipe Journal</p>`,
    corpsText: `Bienvenue {{user.prenom}} !

Nous sommes ravis de vous accueillir sur Journal, votre plateforme de lecture d'éditions numériques.

Votre compte a été créé avec succès. Voici ce que vous pouvez faire maintenant :
- Découvrir les éditions disponibles
- Souscrire à un abonnement pour un accès illimité
- Compléter votre profil

Accéder à mon espace : {{app.url}}/dashboard

Des questions ? Notre équipe support est là pour vous aider.

À très bientôt,
L'équipe Journal`,
    tokens: {
      'user.prenom': 'Prénom de l\'utilisateur',
      'user.nom': 'Nom de l\'utilisateur',
      'user.email': 'Email de l\'utilisateur',
      'app.url': 'URL de l\'application'
    },
    automation: {
      triggerType: 'INSCRIPTION',
      nom: 'Bienvenue automatique',
      description: 'Envoyé automatiquement après inscription'
    }
  },

  // 2. Password Reset
  {
    slug: 'password-reset',
    nom: 'Réinitialisation mot de passe',
    description: 'Lien de réinitialisation du mot de passe',
    category: 'TRANSACTIONAL',
    sujet: 'Réinitialisation de votre mot de passe',
    corps: `<h2>Réinitialisation de mot de passe</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>

<p style="text-align: center;">
  <a href="{{reset.url}}" class="button">Réinitialiser mon mot de passe</a>
</p>

<p><strong>Ce lien expire dans 1 heure.</strong></p>

<p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email. Votre mot de passe restera inchangé.</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

<p style="font-size: 12px; color: #64748b;">
  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
  <a href="{{reset.url}}" style="word-break: break-all;">{{reset.url}}</a>
</p>`,
    corpsText: `Réinitialisation de mot de passe

Bonjour {{user.prenom}},

Vous avez demandé à réinitialiser votre mot de passe. Utilisez le lien ci-dessous pour définir un nouveau mot de passe :

{{reset.url}}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.`,
    tokens: {
      'user.prenom': 'Prénom de l\'utilisateur',
      'user.email': 'Email de l\'utilisateur',
      'reset.url': 'URL de réinitialisation avec token',
      'reset.expiresAt': 'Date d\'expiration du lien'
    }
  },

  // 3. Email Verification
  {
    slug: 'email-verification',
    nom: 'Vérification email',
    description: 'Email de vérification d\'adresse',
    category: 'TRANSACTIONAL',
    sujet: 'Vérifiez votre adresse email',
    corps: `<h2>Vérifiez votre adresse email ✉️</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Pour finaliser votre inscription et accéder à toutes les fonctionnalités, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>

<p style="text-align: center;">
  <a href="{{verification.url}}" class="button">Vérifier mon email</a>
</p>

<p>Ce lien expire dans 24 heures.</p>

<p>Si vous n'avez pas créé de compte sur Journal, ignorez cet email.</p>`,
    corpsText: `Vérifiez votre adresse email

Bonjour {{user.prenom}},

Pour finaliser votre inscription, veuillez vérifier votre adresse email en utilisant le lien ci-dessous :

{{verification.url}}

Ce lien expire dans 24 heures.`,
    tokens: {
      'user.prenom': 'Prénom de l\'utilisateur',
      'verification.url': 'URL de vérification avec token'
    }
  },

  // 4. Subscription Confirmation
  {
    slug: 'subscription-confirmation',
    nom: 'Confirmation abonnement',
    description: 'Confirmation d\'activation d\'abonnement',
    category: 'TRANSACTIONAL',
    sujet: 'Votre abonnement {{subscription.type}} est actif ! 🎉',
    corps: `<h2>Félicitations {{user.prenom}} ! 🎉</h2>

<p>Votre abonnement <strong>{{subscription.type}}</strong> est maintenant actif.</p>

<div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
  <p style="margin: 0;"><strong>Récapitulatif :</strong></p>
  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
    <li>Type : {{subscription.type}}</li>
    <li>Début : {{subscription.dateDebut}}</li>
    <li>Fin : {{subscription.dateFin}}</li>
    <li>Montant : {{subscription.montant}} {{subscription.devise}}</li>
  </ul>
</div>

<p>Vous avez désormais accès à :</p>
<ul>
  <li>✅ Toutes les éditions publiées</li>
  <li>✅ Lecture illimitée</li>
  <li>✅ Téléchargement hors-ligne</li>
</ul>

<p style="text-align: center;">
  <a href="{{app.url}}/editions" class="button">Découvrir les éditions</a>
</p>

<p>Merci pour votre confiance !<br>L'équipe Journal</p>`,
    corpsText: `Félicitations {{user.prenom}} !

Votre abonnement {{subscription.type}} est maintenant actif.

Récapitulatif :
- Type : {{subscription.type}}
- Début : {{subscription.dateDebut}}
- Fin : {{subscription.dateFin}}
- Montant : {{subscription.montant}} {{subscription.devise}}

Vous avez désormais accès à toutes les éditions.

Découvrir les éditions : {{app.url}}/editions

Merci pour votre confiance !
L'équipe Journal`,
    tokens: {
      'user.prenom': 'Prénom',
      'subscription.type': 'MENSUEL | ANNUEL',
      'subscription.dateDebut': 'Date de début formatée',
      'subscription.dateFin': 'Date de fin formatée',
      'subscription.montant': 'Montant payé',
      'subscription.devise': 'XAF | EUR | USD'
    },
    automation: {
      triggerType: 'ABONNEMENT_ACTIF',
      nom: 'Confirmation abonnement',
      description: 'Envoyé automatiquement à l\'activation'
    }
  },

  // 5. Manual Submission Received
  {
    slug: 'manual-submission-received',
    nom: 'Soumission reçue',
    description: 'Confirmation de réception de demande manuelle',
    category: 'TRANSACTIONAL',
    sujet: 'Votre demande d\'abonnement a été reçue',
    corps: `<h2>Demande reçue ✓</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Nous avons bien reçu votre demande d'abonnement avec les informations suivantes :</p>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
  <p style="margin: 0 0 10px 0;"><strong>Détails :</strong></p>
  <ul style="margin: 0; padding-left: 20px;">
    <li>Type : {{subscription.type}}</li>
    <li>Montant : {{subscription.montant}} {{subscription.devise}}</li>
    <li>Référence : {{submission.reference}}</li>
  </ul>
</div>

<p>Notre équipe va vérifier votre preuve de paiement dans les <strong>24 à 48 heures</strong>.</p>

<p>Vous recevrez un email de confirmation dès que votre abonnement sera activé.</p>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions/submissions" class="button">Suivre ma demande</a>
</p>

<p>Des questions ? Contactez notre support.</p>`,
    corpsText: `Demande reçue

Bonjour {{user.prenom}},

Nous avons bien reçu votre demande d'abonnement :
- Type : {{subscription.type}}
- Montant : {{subscription.montant}} {{subscription.devise}}
- Référence : {{submission.reference}}

Notre équipe va vérifier votre preuve de paiement dans les 24 à 48 heures.

Suivre ma demande : {{app.url}}/subscriptions/submissions`,
    tokens: {
      'user.prenom': 'Prénom',
      'subscription.type': 'Type d\'abonnement',
      'subscription.montant': 'Montant',
      'subscription.devise': 'Devise',
      'submission.reference': 'Référence de la soumission'
    }
  },

  // 6. Manual Submission Approved
  {
    slug: 'manual-submission-approved',
    nom: 'Soumission approuvée',
    description: 'Notification d\'approbation de paiement manuel',
    category: 'TRANSACTIONAL',
    sujet: 'Votre abonnement a été validé ! ✅',
    corps: `<h2>Abonnement validé ! 🎉</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Excellente nouvelle ! Votre demande d'abonnement a été <strong style="color: #10b981;">approuvée</strong> par notre équipe.</p>

<div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
  <p style="margin: 0;"><strong>Votre abonnement est actif !</strong></p>
  <p style="margin: 10px 0 0 0;">Valide jusqu'au : <strong>{{subscription.dateFin}}</strong></p>
</div>

<p>Vous avez maintenant accès à toutes les éditions du journal.</p>

<p style="text-align: center;">
  <a href="{{app.url}}/dashboard" class="button">Accéder à mon espace</a>
</p>

<p>Merci pour votre confiance !<br>L'équipe Journal</p>`,
    corpsText: `Abonnement validé !

Bonjour {{user.prenom}},

Excellente nouvelle ! Votre demande d'abonnement a été approuvée.

Votre abonnement est actif jusqu'au {{subscription.dateFin}}.

Accéder à mon espace : {{app.url}}/dashboard

Merci pour votre confiance !
L'équipe Journal`,
    tokens: {
      'user.prenom': 'Prénom',
      'subscription.dateFin': 'Date de fin'
    }
  },

  // 7. Manual Submission Rejected
  {
    slug: 'manual-submission-rejected',
    nom: 'Soumission rejetée',
    description: 'Notification de rejet de paiement manuel',
    category: 'TRANSACTIONAL',
    sujet: 'Problème avec votre demande d\'abonnement',
    corps: `<h2>Demande non validée</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Nous avons examiné votre demande d'abonnement, mais malheureusement nous n'avons pas pu la valider.</p>

<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
  <p style="margin: 0;"><strong>Raison :</strong></p>
  <p style="margin: 10px 0 0 0;">{{rejection.reason}}</p>
</div>

<p><strong>Que faire maintenant ?</strong></p>
<ul>
  <li>Vérifiez que votre preuve de paiement est lisible et complète</li>
  <li>Assurez-vous que le montant correspond au tarif de l'abonnement</li>
  <li>Soumettez une nouvelle demande avec les corrections</li>
</ul>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions/manual" class="button">Soumettre une nouvelle demande</a>
</p>

<p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support.</p>`,
    corpsText: `Demande non validée

Bonjour {{user.prenom}},

Nous avons examiné votre demande d'abonnement, mais nous n'avons pas pu la valider.

Raison : {{rejection.reason}}

Que faire maintenant ?
- Vérifiez que votre preuve de paiement est lisible et complète
- Assurez-vous que le montant correspond au tarif
- Soumettez une nouvelle demande

Nouvelle demande : {{app.url}}/subscriptions/manual`,
    tokens: {
      'user.prenom': 'Prénom',
      'rejection.reason': 'Motif du rejet'
    }
  },

  // 8. Subscription Expiring 7 days
  {
    slug: 'subscription-expiring-7days',
    nom: 'Expiration J-7',
    description: 'Alerte 7 jours avant expiration',
    category: 'TRANSACTIONAL',
    sujet: 'Votre abonnement expire dans 7 jours',
    corps: `<h2>⏰ Votre abonnement expire bientôt</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Votre abonnement au Journal arrive à expiration dans <strong>7 jours</strong>, le <strong>{{subscription.dateFin}}</strong>.</p>

<p>Pour continuer à profiter d'un accès illimité à toutes les éditions, pensez à renouveler dès maintenant.</p>

<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
  <p style="margin: 0;"><strong>💡 Astuce :</strong> Optez pour l'abonnement annuel et économisez 20% !</p>
</div>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions" class="button">Renouveler mon abonnement</a>
</p>

<p>Des questions ? Notre équipe est là pour vous aider.</p>`,
    corpsText: `Votre abonnement expire bientôt

Bonjour {{user.prenom}},

Votre abonnement au Journal arrive à expiration dans 7 jours, le {{subscription.dateFin}}.

Pour continuer à profiter d'un accès illimité, renouvelez dès maintenant.

Astuce : Optez pour l'abonnement annuel et économisez 20% !

Renouveler : {{app.url}}/subscriptions`,
    tokens: {
      'user.prenom': 'Prénom',
      'subscription.dateFin': 'Date d\'expiration formatée'
    },
    automation: {
      triggerType: 'ABONNEMENT_EXPIRE_BIENTOT',
      nom: 'Alerte expiration J-7',
      description: 'Envoyé 7 jours avant expiration',
      delayMinutes: 0
    }
  },

  // 9. Subscription Expiring 1 day
  {
    slug: 'subscription-expiring-1day',
    nom: 'Expiration J-1',
    description: 'Alerte 1 jour avant expiration',
    category: 'TRANSACTIONAL',
    sujet: '⚠️ Dernier jour : votre abonnement expire demain',
    corps: `<h2>⚠️ Dernier rappel</h2>

<p>Bonjour {{user.prenom}},</p>

<p>C'est votre <strong>dernière chance</strong> ! Votre abonnement expire <strong>demain</strong>, le <strong>{{subscription.dateFin}}</strong>.</p>

<p>Après cette date, vous n'aurez plus accès aux éditions. Renouvelez maintenant pour ne rien manquer.</p>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions" class="button" style="background: #ef4444;">Renouveler maintenant</a>
</p>

<p>Si vous avez déjà renouvelé, ignorez ce message.</p>`,
    corpsText: `Dernier rappel

Bonjour {{user.prenom}},

C'est votre dernière chance ! Votre abonnement expire demain, le {{subscription.dateFin}}.

Après cette date, vous n'aurez plus accès aux éditions.

Renouveler maintenant : {{app.url}}/subscriptions

Si vous avez déjà renouvelé, ignorez ce message.`,
    tokens: {
      'user.prenom': 'Prénom',
      'subscription.dateFin': 'Date d\'expiration'
    },
    automation: {
      triggerType: 'ABONNEMENT_EXPIRE_BIENTOT',
      nom: 'Alerte expiration J-1',
      description: 'Envoyé 1 jour avant expiration',
      delayMinutes: 0
    }
  },

  // 10. Subscription Expired
  {
    slug: 'subscription-expired',
    nom: 'Abonnement expiré',
    description: 'Notification d\'expiration',
    category: 'TRANSACTIONAL',
    sujet: 'Votre abonnement a expiré',
    corps: `<h2>Votre abonnement a expiré</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Votre abonnement au Journal a expiré le <strong>{{subscription.dateFin}}</strong>.</p>

<p>Vous n'avez plus accès aux éditions. Pour reprendre votre lecture, renouvelez votre abonnement.</p>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions" class="button">Renouveler mon abonnement</a>
</p>

<p>Nous espérons vous revoir bientôt !<br>L'équipe Journal</p>`,
    corpsText: `Votre abonnement a expiré

Bonjour {{user.prenom}},

Votre abonnement au Journal a expiré le {{subscription.dateFin}}.

Vous n'avez plus accès aux éditions. Pour reprendre votre lecture, renouvelez votre abonnement.

Renouveler : {{app.url}}/subscriptions

Nous espérons vous revoir bientôt !
L'équipe Journal`,
    tokens: {
      'user.prenom': 'Prénom',
      'subscription.dateFin': 'Date d\'expiration'
    },
    automation: {
      triggerType: 'ABONNEMENT_EXPIRE',
      nom: 'Notification expiration',
      description: 'Envoyé le jour de l\'expiration'
    }
  },

  // 11. New Edition Available
  {
    slug: 'new-edition-available',
    nom: 'Nouvelle édition',
    description: 'Annonce de nouvelle édition',
    category: 'MARKETING',
    sujet: '📰 Nouvelle édition disponible : {{edition.titre}}',
    corps: `<h2>📰 Nouvelle édition !</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Une nouvelle édition vient d'être publiée :</p>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
  <h3 style="margin: 0 0 10px 0; color: #0f172a;">{{edition.titre}}</h3>
  <p style="margin: 0; color: #64748b;">Publié le {{edition.datePublication}}</p>
</div>

<p style="text-align: center;">
  <a href="{{app.url}}/editions/{{edition.id}}" class="button">Lire maintenant</a>
</p>

<p>Bonne lecture !<br>L'équipe Journal</p>`,
    corpsText: `Nouvelle édition !

Bonjour {{user.prenom}},

Une nouvelle édition vient d'être publiée :

{{edition.titre}}
Publié le {{edition.datePublication}}

Lire maintenant : {{app.url}}/editions/{{edition.id}}

Bonne lecture !
L'équipe Journal`,
    tokens: {
      'user.prenom': 'Prénom',
      'edition.id': 'ID de l\'édition',
      'edition.titre': 'Titre de l\'édition',
      'edition.datePublication': 'Date de publication'
    },
    automation: {
      triggerType: 'NOUVELLE_EDITION',
      nom: 'Notification nouvelle édition',
      description: 'Envoyé à tous les abonnés actifs'
    }
  },

  // 12. Enterprise Invitation
  {
    slug: 'enterprise-invitation',
    nom: 'Invitation entreprise',
    description: 'Invitation à rejoindre une entreprise',
    category: 'TRANSACTIONAL',
    sujet: '{{enterprise.nom}} vous invite à rejoindre Journal',
    corps: `<h2>Vous êtes invité ! 🎉</h2>

<p>Bonjour,</p>

<p><strong>{{inviter.nom}}</strong> de <strong>{{enterprise.nom}}</strong> vous invite à rejoindre leur espace Journal.</p>

<p>En acceptant cette invitation, vous aurez accès à toutes les éditions du journal, sans frais supplémentaires.</p>

<p style="text-align: center;">
  <a href="{{invitation.url}}" class="button">Accepter l'invitation</a>
</p>

<p>Cette invitation expire le <strong>{{invitation.expiresAt}}</strong>.</p>

<p>Si vous ne connaissez pas cette entreprise, ignorez cet email.</p>`,
    corpsText: `Vous êtes invité !

Bonjour,

{{inviter.nom}} de {{enterprise.nom}} vous invite à rejoindre leur espace Journal.

En acceptant cette invitation, vous aurez accès à toutes les éditions du journal.

Accepter l'invitation : {{invitation.url}}

Cette invitation expire le {{invitation.expiresAt}}.

Si vous ne connaissez pas cette entreprise, ignorez cet email.`,
    tokens: {
      'inviter.nom': 'Nom de la personne qui invite',
      'enterprise.nom': 'Nom de l\'entreprise',
      'invitation.url': 'URL d\'acceptation',
      'invitation.expiresAt': 'Date d\'expiration'
    },
    automation: {
      triggerType: 'INVITATION_ENTREPRISE',
      nom: 'Invitation entreprise',
      description: 'Envoyé lors d\'une invitation'
    }
  },

  // 13. Payment Received
  {
    slug: 'payment-received',
    nom: 'Paiement reçu',
    description: 'Confirmation de paiement',
    category: 'TRANSACTIONAL',
    sujet: 'Confirmation de paiement - {{payment.reference}}',
    corps: `<h2>Paiement reçu ✓</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Nous confirmons la réception de votre paiement :</p>

<div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 5px 0; color: #64748b;">Référence :</td>
      <td style="padding: 5px 0; text-align: right; font-weight: 600;">{{payment.reference}}</td>
    </tr>
    <tr>
      <td style="padding: 5px 0; color: #64748b;">Montant :</td>
      <td style="padding: 5px 0; text-align: right; font-weight: 600;">{{payment.montant}} {{payment.devise}}</td>
    </tr>
    <tr>
      <td style="padding: 5px 0; color: #64748b;">Date :</td>
      <td style="padding: 5px 0; text-align: right;">{{payment.date}}</td>
    </tr>
    <tr>
      <td style="padding: 5px 0; color: #64748b;">Moyen :</td>
      <td style="padding: 5px 0; text-align: right;">{{payment.methode}}</td>
    </tr>
  </table>
</div>

<p>Vous pouvez télécharger votre facture depuis votre espace personnel.</p>

<p style="text-align: center;">
  <a href="{{app.url}}/profile/payments" class="button">Voir mes paiements</a>
</p>

<p>Merci !<br>L'équipe Journal</p>`,
    corpsText: `Paiement reçu

Bonjour {{user.prenom}},

Nous confirmons la réception de votre paiement :

Référence : {{payment.reference}}
Montant : {{payment.montant}} {{payment.devise}}
Date : {{payment.date}}
Moyen : {{payment.methode}}

Voir mes paiements : {{app.url}}/profile/payments

Merci !
L'équipe Journal`,
    tokens: {
      'user.prenom': 'Prénom',
      'payment.reference': 'Référence du paiement',
      'payment.montant': 'Montant',
      'payment.devise': 'Devise',
      'payment.date': 'Date du paiement',
      'payment.methode': 'Méthode de paiement'
    },
    automation: {
      triggerType: 'PAIEMENT_RECU',
      nom: 'Confirmation paiement',
      description: 'Envoyé après confirmation de paiement'
    }
  },

  // 14. Payment Failed
  {
    slug: 'payment-failed',
    nom: 'Paiement échoué',
    description: 'Notification d\'échec de paiement',
    category: 'TRANSACTIONAL',
    sujet: '⚠️ Problème avec votre paiement',
    corps: `<h2>⚠️ Échec de paiement</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Votre paiement de <strong>{{payment.montant}} {{payment.devise}}</strong> n'a pas pu être traité.</p>

<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
  <p style="margin: 0;"><strong>Raison :</strong> {{payment.errorMessage}}</p>
</div>

<p><strong>Que faire ?</strong></p>
<ul>
  <li>Vérifiez que votre carte ou compte Mobile Money est valide</li>
  <li>Assurez-vous d'avoir suffisamment de fonds</li>
  <li>Réessayez le paiement</li>
</ul>

<p style="text-align: center;">
  <a href="{{app.url}}/payments/checkout" class="button">Réessayer le paiement</a>
</p>

<p>Si le problème persiste, contactez votre banque ou notre support.</p>`,
    corpsText: `Échec de paiement

Bonjour {{user.prenom}},

Votre paiement de {{payment.montant}} {{payment.devise}} n'a pas pu être traité.

Raison : {{payment.errorMessage}}

Que faire ?
- Vérifiez que votre carte ou compte Mobile Money est valide
- Assurez-vous d'avoir suffisamment de fonds
- Réessayez le paiement

Réessayer : {{app.url}}/payments/checkout

Si le problème persiste, contactez votre banque ou notre support.`,
    tokens: {
      'user.prenom': 'Prénom',
      'payment.montant': 'Montant',
      'payment.devise': 'Devise',
      'payment.errorMessage': 'Message d\'erreur'
    },
    automation: {
      triggerType: 'PAIEMENT_ECHOUE',
      nom: 'Notification échec paiement',
      description: 'Envoyé après un échec de paiement'
    }
  }
];

async function main() {
  console.log('🌱 Seeding email templates...\n');

  // 1. Créer le layout par défaut
  console.log('📐 Creating default layout...');
  const layout = await prisma.emailLayout.upsert({
    where: { nom: 'default-layout' },
    update: {
      mjml: DEFAULT_LAYOUT_MJML,
      description: 'Layout par défaut avec header, content et footer'
    },
    create: {
      nom: 'default-layout',
      description: 'Layout par défaut avec header, content et footer',
      mjml: DEFAULT_LAYOUT_MJML
    }
  });
  console.log(`  ✓ Layout created: ${layout.nom}\n`);

  // 2. Créer les templates
  console.log('📧 Creating email templates...');
  for (const template of TEMPLATES) {
    const created = await prisma.emailTemplate.upsert({
      where: { slug: template.slug },
      update: {
        nom: template.nom,
        description: template.description,
        category: template.category,
        sujet: template.sujet,
        corps: template.corps,
        corpsText: template.corpsText,
        tokens: template.tokens,
        layoutId: layout.id,
        status: 'ACTIVE' as EmailTemplateStatus
      },
      create: {
        slug: template.slug,
        nom: template.nom,
        description: template.description,
        category: template.category,
        sujet: template.sujet,
        corps: template.corps,
        corpsText: template.corpsText,
        tokens: template.tokens,
        layoutId: layout.id,
        status: 'ACTIVE' as EmailTemplateStatus
      }
    });
    console.log(`  ✓ ${created.slug}`);

    // 3. Créer l'automation si définie
    if (template.automation) {
      await prisma.emailAutomation.upsert({
        where: { 
          id: `automation-${template.slug}` // Utiliser un ID stable pour upsert
        },
        update: {
          nom: template.automation.nom,
          description: template.automation.description,
          triggerType: template.automation.triggerType,
          templateId: created.id,
          delayMinutes: template.automation.delayMinutes ?? 0,
          active: true
        },
        create: {
          id: `automation-${template.slug}`,
          nom: template.automation.nom,
          description: template.automation.description,
          triggerType: template.automation.triggerType,
          templateId: created.id,
          delayMinutes: template.automation.delayMinutes ?? 0,
          active: true
        }
      });
      console.log(`    → Automation: ${template.automation.nom}`);
    }
  }

  console.log('\n✅ Email templates seeding completed!');
  console.log(`   - 1 layout created`);
  console.log(`   - ${TEMPLATES.length} templates created`);
  console.log(`   - ${TEMPLATES.filter(t => t.automation).length} automations created`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding email templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
