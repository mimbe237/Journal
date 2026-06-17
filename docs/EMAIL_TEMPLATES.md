# 📧 Documentation des Templates Email

> **Système :** EmailTemplate avec Prisma
> **Admin UI :** `/admin/emails/templates`
> **Tokens :** Variables dynamiques remplacées à l'envoi

---

## 🏗️ Architecture du système

### Modèles Prisma

```prisma
model EmailLayout {
  id          String   @id @default(cuid())
  nom         String   @unique
  description String?
  mjml        String   @db.Text  // Template MJML avec {{content}}
}

model EmailTemplate {
  id          String              @id @default(cuid())
  slug        String              @unique      // Identifiant unique
  nom         String                           // Nom affiché
  category    EmailCategory       @default(TRANSACTIONAL)
  sujet       String                           // Objet de l'email
  corps       String              @db.Text     // Corps MJML/HTML
  corpsText   String?             @db.Text     // Version texte brut
  layoutId    String?                          // Layout parent
  tokens      Json?                            // Tokens attendus
  status      EmailTemplateStatus @default(DRAFT)
}

model EmailAutomation {
  id            String           @id @default(cuid())
  nom           String
  triggerType   EmailTriggerType // Événement déclencheur
  templateId    String           // Template à envoyer
  delayMinutes  Int              @default(0)
  active        Boolean          @default(true)
}
```

### Types de triggers disponibles

```typescript
enum EmailTriggerType {
  INSCRIPTION              // Nouvelle inscription
  ABONNEMENT_ACTIF         // Abonnement activé
  ABONNEMENT_EXPIRE        // Abonnement expiré
  ABONNEMENT_EXPIRE_BIENTOT // Expiration proche
  PAIEMENT_RECU           // Paiement confirmé
  PAIEMENT_ECHOUE         // Échec de paiement
  NOUVELLE_EDITION        // Nouvelle édition publiée
  BIENVENUE_ENTREPRISE    // Nouveau compte entreprise
  INVITATION_ENTREPRISE   // Invitation à rejoindre
  MANUEL                  // Envoi manuel
}
```

---

## 🎨 Layout Principal

### Créer le layout de base

**Nom :** `default-layout`

```html
<!DOCTYPE html>
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
</html>
```

---

## 📋 Templates par défaut

### 1. `welcome` - Bienvenue

**Trigger :** `INSCRIPTION`
**Sujet :** `Bienvenue sur Journal, {{user.prenom}} ! 🎉`

```html
<h2>Bienvenue {{user.prenom}} ! 👋</h2>

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

<p>À très bientôt,<br>L'équipe Journal</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom de l'utilisateur",
  "user.nom": "Nom de l'utilisateur",
  "user.email": "Email de l'utilisateur",
  "app.url": "URL de l'application"
}
```

---

### 2. `password-reset` - Réinitialisation mot de passe

**Trigger :** `MANUEL`
**Sujet :** `Réinitialisation de votre mot de passe`

```html
<h2>Réinitialisation de mot de passe</h2>

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
</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom de l'utilisateur",
  "user.email": "Email de l'utilisateur",
  "reset.url": "URL de réinitialisation avec token",
  "reset.expiresAt": "Date d'expiration du lien"
}
```

---

### 3. `email-verification` - Vérification email

**Trigger :** `INSCRIPTION`
**Sujet :** `Vérifiez votre adresse email`

```html
<h2>Vérifiez votre adresse email ✉️</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Pour finaliser votre inscription et accéder à toutes les fonctionnalités, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>

<p style="text-align: center;">
  <a href="{{verification.url}}" class="button">Vérifier mon email</a>
</p>

<p>Ce lien expire dans 24 heures.</p>

<p>Si vous n'avez pas créé de compte sur Journal, ignorez cet email.</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom de l'utilisateur",
  "verification.url": "URL de vérification avec token"
}
```

---

### 4. `subscription-confirmation` - Confirmation abonnement

**Trigger :** `ABONNEMENT_ACTIF`
**Sujet :** `Votre abonnement {{subscription.type}} est actif ! 🎉`

```html
<h2>Félicitations {{user.prenom}} ! 🎉</h2>

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

<p>Merci pour votre confiance !<br>L'équipe Journal</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "subscription.type": "MENSUEL | ANNUEL",
  "subscription.dateDebut": "Date de début formatée",
  "subscription.dateFin": "Date de fin formatée",
  "subscription.montant": "Montant payé",
  "subscription.devise": "XAF | EUR | USD"
}
```

---

### 5. `manual-submission-received` - Soumission reçue

**Trigger :** `MANUEL`
**Sujet :** `Votre demande d'abonnement a été reçue`

```html
<h2>Demande reçue ✓</h2>

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

<p>Des questions ? Contactez notre support.</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "subscription.type": "Type d'abonnement",
  "subscription.montant": "Montant",
  "subscription.devise": "Devise",
  "submission.reference": "Référence de la soumission"
}
```

---

### 6. `manual-submission-approved` - Soumission approuvée

**Trigger :** `ABONNEMENT_ACTIF`
**Sujet :** `Votre abonnement a été validé ! ✅`

```html
<h2>Abonnement validé ! 🎉</h2>

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

<p>Merci pour votre confiance !<br>L'équipe Journal</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "subscription.dateFin": "Date de fin"
}
```

---

### 7. `manual-submission-rejected` - Soumission rejetée

**Trigger :** `MANUEL`
**Sujet :** `Problème avec votre demande d'abonnement`

```html
<h2>Demande non validée</h2>

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

<p>Si vous pensez qu'il s'agit d'une erreur, contactez notre support.</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "rejection.reason": "Motif du rejet"
}
```

---

### 8. `subscription-expiring-7days` - Expiration J-7

**Trigger :** `ABONNEMENT_EXPIRE_BIENTOT`
**Sujet :** `Votre abonnement expire dans 7 jours`

```html
<h2>⏰ Votre abonnement expire bientôt</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Votre abonnement au Journal arrive à expiration dans <strong>7 jours</strong>, le <strong>{{subscription.dateFin}}</strong>.</p>

<p>Pour continuer à profiter d'un accès illimité à toutes les éditions, pensez à renouveler dès maintenant.</p>

<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
  <p style="margin: 0;"><strong>💡 Astuce :</strong> Optez pour l'abonnement annuel et économisez 20% !</p>
</div>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions" class="button">Renouveler mon abonnement</a>
</p>

<p>Des questions ? Notre équipe est là pour vous aider.</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "subscription.dateFin": "Date d'expiration formatée"
}
```

---

### 9. `subscription-expiring-1day` - Expiration J-1

**Trigger :** `ABONNEMENT_EXPIRE_BIENTOT`
**Sujet :** `⚠️ Dernier jour : votre abonnement expire demain`

```html
<h2>⚠️ Dernier rappel</h2>

<p>Bonjour {{user.prenom}},</p>

<p>C'est votre <strong>dernière chance</strong> ! Votre abonnement expire <strong>demain</strong>, le <strong>{{subscription.dateFin}}</strong>.</p>

<p>Après cette date, vous n'aurez plus accès aux éditions. Renouvelez maintenant pour ne rien manquer.</p>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions" class="button" style="background: #ef4444;">Renouveler maintenant</a>
</p>

<p>Si vous avez déjà renouvelé, ignorez ce message.</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "subscription.dateFin": "Date d'expiration"
}
```

---

### 10. `subscription-expired` - Abonnement expiré

**Trigger :** `ABONNEMENT_EXPIRE`
**Sujet :** `Votre abonnement a expiré`

```html
<h2>Votre abonnement a expiré</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Votre abonnement au Journal a expiré le <strong>{{subscription.dateFin}}</strong>.</p>

<p>Vous n'avez plus accès aux éditions. Pour reprendre votre lecture, renouvelez votre abonnement.</p>

<p style="text-align: center;">
  <a href="{{app.url}}/subscriptions" class="button">Renouveler mon abonnement</a>
</p>

<p>Nous espérons vous revoir bientôt !<br>L'équipe Journal</p>
```

---

### 11. `new-edition-available` - Nouvelle édition

**Trigger :** `NOUVELLE_EDITION`
**Sujet :** `📰 Nouvelle édition disponible : {{edition.titre}}`

```html
<h2>📰 Nouvelle édition !</h2>

<p>Bonjour {{user.prenom}},</p>

<p>Une nouvelle édition vient d'être publiée :</p>

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
  <h3 style="margin: 0 0 10px 0; color: #0f172a;">{{edition.titre}}</h3>
  <p style="margin: 0; color: #64748b;">Publié le {{edition.datePublication}}</p>
</div>

<p style="text-align: center;">
  <a href="{{app.url}}/editions/{{edition.id}}" class="button">Lire maintenant</a>
</p>

<p>Bonne lecture !<br>L'équipe Journal</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "edition.id": "ID de l'édition",
  "edition.titre": "Titre de l'édition",
  "edition.datePublication": "Date de publication"
}
```

---

### 12. `enterprise-invitation` - Invitation entreprise

**Trigger :** `INVITATION_ENTREPRISE`
**Sujet :** `{{enterprise.nom}} vous invite à rejoindre Journal`

```html
<h2>Vous êtes invité ! 🎉</h2>

<p>Bonjour,</p>

<p><strong>{{inviter.nom}}</strong> de <strong>{{enterprise.nom}}</strong> vous invite à rejoindre leur espace Journal.</p>

<p>En acceptant cette invitation, vous aurez accès à toutes les éditions du journal, sans frais supplémentaires.</p>

<p style="text-align: center;">
  <a href="{{invitation.url}}" class="button">Accepter l'invitation</a>
</p>

<p>Cette invitation expire le <strong>{{invitation.expiresAt}}</strong>.</p>

<p>Si vous ne connaissez pas cette entreprise, ignorez cet email.</p>
```

**Tokens :**
```json
{
  "inviter.nom": "Nom de la personne qui invite",
  "enterprise.nom": "Nom de l'entreprise",
  "invitation.url": "URL d'acceptation",
  "invitation.expiresAt": "Date d'expiration"
}
```

---

### 13. `payment-received` - Paiement reçu

**Trigger :** `PAIEMENT_RECU`
**Sujet :** `Confirmation de paiement - {{payment.reference}}`

```html
<h2>Paiement reçu ✓</h2>

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

<p>Merci !<br>L'équipe Journal</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "payment.reference": "Référence du paiement",
  "payment.montant": "Montant",
  "payment.devise": "Devise",
  "payment.date": "Date du paiement",
  "payment.methode": "Méthode de paiement"
}
```

---

### 14. `payment-failed` - Paiement échoué

**Trigger :** `PAIEMENT_ECHOUE`
**Sujet :** `⚠️ Problème avec votre paiement`

```html
<h2>⚠️ Échec de paiement</h2>

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

<p>Si le problème persiste, contactez votre banque ou notre support.</p>
```

**Tokens :**
```json
{
  "user.prenom": "Prénom",
  "payment.montant": "Montant",
  "payment.devise": "Devise",
  "payment.errorMessage": "Message d'erreur"
}
```

---

## 🔧 Script de seed

Pour insérer tous ces templates en base, utilisez le script :
`prisma/seeds/seedEmailTemplates.ts`

Commande :
```bash
npx ts-node prisma/seeds/seedEmailTemplates.ts
```

---

## 🧪 Test des templates

1. Aller sur `/admin/emails/templates`
2. Cliquer sur un template
3. Utiliser "Envoyer un test" avec un email de test
4. Vérifier la réception et le rendu

---

## 📝 Bonnes pratiques

1. **Toujours fournir les tokens** - Documenter les tokens attendus pour chaque template
2. **Version texte** - Toujours avoir une version texte brut pour les clients email basiques
3. **Mobile-first** - Tester sur mobile (max-width: 600px)
4. **Accessibilité** - Contraste suffisant, textes alternatifs pour boutons
5. **Call-to-action clair** - Un seul CTA principal par email
6. **Unsubscribe** - Toujours inclure un lien de désinscription

---

*Document généré automatiquement - Dernière mise à jour : Décembre 2024*
