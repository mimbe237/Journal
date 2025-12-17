# 📋 TODO LIST GLOBAL - Améliorations UX Journal

> **Date de création :** Décembre 2024
> **Objectif :** Implémenter toutes les améliorations UX identifiées pour offrir une expérience utilisateur professionnelle et complète.

---

## 📊 Vue d'ensemble

| Phase | Priorité | Nombre de tâches | Estimation |
|-------|----------|------------------|------------|
| Phase 1 | 🔴 Critique (Sécurité) | 5 tâches | 2-3 jours |
| Phase 2 | 🟠 Haute (Engagement) | 6 tâches | 3-4 jours |
| Phase 3 | 🟡 Moyenne (Productivité) | 6 tâches | 3-4 jours |
| Phase 4 | 🟢 Basse (Polish) | 5 tâches | 2-3 jours |
| Templates Email | 🔴 Critique | 11 templates | 1-2 jours |

---

## 🛠️ MAINTENANCE & CORRECTIFS (17/12/2025)

> **État :** ✅ Build Stable | 0 Erreurs TypeScript

**Correctifs Majeurs :**
- [x] **Alignement Schema Prisma :** Migration des champs anglais (`firstName`, `createdAt`) vers le schéma français (`nom`, `dateCreation`) sur toutes les routes API.
- [x] **Refonte API Admin :** Réécriture complète des routes `search`, `stats`, `export`, `users/[id]/role`.
- [x] **Correction Auth :** Remplacement de `verifyToken` par `verifyJwt` et correction des imports.
- [x] **Upload Fichiers :** Augmentation limite `bodyParser` (50mb) pour éviter les erreurs 413.
- [x] **UI Fixes :** Correction z-index `EditionReader` et crash `Object.entries`.

**Reste à faire (Technique) :**
- [ ] **Cron Subscription Alerts :** Intégrer le service d'envoi d'email réel (actuellement TODO dans le code).
- [ ] **Vérification Runtime :** Tester manuellement les routes réécrites (Search, Export, Stats).

---

## 🔴 PHASE 1 : SÉCURITÉ & FONDAMENTAUX (Priorité Critique)

### 1.1 ✅ Réinitialisation de mot de passe

**Fichiers à créer/modifier :**
- `src/app/auth/forgot-password/page.tsx` (nouveau)
- `src/app/auth/reset-password/page.tsx` (nouveau)
- `src/app/api/auth/forgot-password/route.ts` (nouveau)
- `src/app/api/auth/reset-password/route.ts` (nouveau)
- `prisma/schema.prisma` (ajouter PasswordResetToken)

**Spécifications :**
```typescript
// Schéma Prisma à ajouter
model PasswordResetToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
  @@map("password_reset_tokens")
}
```

**Flux :**
1. Utilisateur entre son email sur `/auth/forgot-password`
2. API génère un token unique (crypto.randomUUID), expire en 1h
3. Email envoyé avec lien `/auth/reset-password?token=xxx`
4. Utilisateur définit nouveau mot de passe
5. Token marqué comme utilisé

**Template email :** `password-reset`

---

### 1.2 ✅ Changement de mot de passe (connecté)

**Fichiers à créer/modifier :**
- `src/app/profile/security/page.tsx` (nouveau)
- `src/app/api/auth/change-password/route.ts` (nouveau)
- `src/app/profile/page.tsx` (ajouter lien sécurité)

**Spécifications :**
- Demander mot de passe actuel pour validation
- Nouveau mot de passe + confirmation
- Validation : min 8 caractères, 1 majuscule, 1 chiffre
- Déconnexion des autres sessions (optionnel)

---

### 1.3 ✅ Harmonisation des devises

**Fichiers à modifier :**
- `src/modules/currencies/` (utiliser partout)
- `src/app/subscriptions/page.tsx` (affichage uniforme)
- `src/app/payments/checkout/page.tsx` (affichage uniforme)
- `src/components/ui/PriceDisplay.tsx` (nouveau composant)

**Spécifications :**
```typescript
// Composant PriceDisplay.tsx
interface PriceDisplayProps {
  amount: number;
  currency: string; // 'XAF' | 'EUR' | 'USD'
  showSymbol?: boolean;
}

// Format : "15 000 XAF" ou "15 000 FCFA"
// Utiliser Intl.NumberFormat avec locale appropriée
```

---

### 1.4 ✅ Système de notifications toast

**Fichiers à créer/modifier :**
- `src/components/ui/Toaster.tsx` (nouveau)
- `src/lib/hooks/useToast.ts` (nouveau)
- `src/app/layout.tsx` (intégrer Toaster)

**Spécifications :**
- Utiliser react-hot-toast ou créer custom
- Types : success, error, warning, info
- Position : top-right
- Durée : 4 secondes par défaut
- Animation slide-in/fade-out

**Intégration :**
```typescript
// Exemple d'utilisation
const { toast } = useToast();
toast.success("Abonnement activé avec succès !");
toast.error("Erreur lors du paiement");
```

---

### 1.5 ✅ Alertes d'expiration d'abonnement

**Fichiers à créer/modifier :**
- `src/app/api/cron/subscription-alerts/route.ts` (nouveau)
- `src/components/SubscriptionExpiryBanner.tsx` (nouveau)
- `src/app/dashboard/page.tsx` (intégrer banner)

**Spécifications :**
- Cron job quotidien vérifie les abonnements
- Alertes à J-7 et J-1 (configurable)
- Email + bannière dans l'interface
- Bannière avec CTA "Renouveler maintenant"

**Templates email :** `subscription-expiring-7days`, `subscription-expiring-1day`

---

## 🟠 PHASE 2 : ENGAGEMENT UTILISATEUR (Priorité Haute)

### 2.1 ✅ Reprise de lecture (Resume Reading)

**Fichiers à créer/modifier :**
- `src/modules/editions/components/EditionReader.tsx` (modifier)
- `src/app/api/reading-sessions/route.ts` (nouveau)
- `prisma/schema.prisma` (ajouter ReadingProgress)

**Schéma :**
```typescript
model ReadingProgress {
  id        String   @id @default(cuid())
  userId    String
  editionId String
  pageNumber Int
  totalPages Int
  percentage Float    @default(0)
  lastReadAt DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  edition   Edition  @relation(fields: [editionId], references: [id], onDelete: Cascade)
  
  @@unique([userId, editionId])
  @@index([userId, lastReadAt])
  @@map("reading_progress")
}
```

**Spécifications :**
- Sauvegarder page courante toutes les 30 secondes
- Au retour, proposer "Reprendre à la page X"
- Afficher progression sur les cartes d'édition

---

### 2.2 ✅ Historique de lecture

**Fichiers à créer/modifier :**
- `src/app/dashboard/history/page.tsx` (nouveau)
- `src/components/ReadingHistory.tsx` (nouveau)

**Spécifications :**
- Liste des éditions lues récemment
- Date de dernière lecture
- Progression (pourcentage)
- Filtre par période (7j, 30j, tout)

---

### 2.3 ✅ Pagination des listes (admin)

**Fichiers à modifier :**
- `src/app/admin/subscribers/page.tsx`
- `src/app/admin/subscriptions/page.tsx`
- `src/app/admin/editions/page.tsx`
- `src/components/ui/Pagination.tsx` (nouveau)

**Spécifications :**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}
```
- Afficher : "Page 1 sur 10 (150 résultats)"
- Options de taille : 10, 25, 50, 100

---

### 2.4 ✅ Parcours d'onboarding

**Fichiers à créer/modifier :**
- `src/components/onboarding/OnboardingModal.tsx` (nouveau)
- `src/components/onboarding/OnboardingSteps.tsx` (nouveau)
- `src/app/dashboard/page.tsx` (déclencher pour nouveaux users)
- `prisma/schema.prisma` (ajouter hasCompletedOnboarding au User)

**Étapes d'onboarding :**
1. Bienvenue + présentation
2. Découvrir les éditions disponibles
3. Comment lire une édition
4. Gérer son abonnement
5. Besoin d'aide ? (Support)

---

### 2.5 ✅ Sidebar admin rétractable

**Fichiers à modifier :**
- `src/app/admin/layout.tsx`
- `src/components/admin/AdminSidebar.tsx`

**Spécifications :**
- Bouton toggle pour rétracter/étendre
- Icônes seulement en mode rétracté
- Préférence sauvegardée en localStorage
- Animation fluide (width transition)

---

### 2.6 ✅ Page de gestion d'abonnement

**Fichiers à créer :**
- `src/app/subscriptions/manage/page.tsx` (nouveau)
- `src/components/subscriptions/SubscriptionDetails.tsx` (nouveau)
- `src/components/subscriptions/SubscriptionActions.tsx` (nouveau)

**Fonctionnalités :**
- Voir détails abonnement actuel
- Date de début/fin
- Type (mensuel/annuel)
- Statut paiement
- Bouton renouveler si expire bientôt
- Historique des paiements
- Factures téléchargeables

---

## 🟡 PHASE 3 : PRODUCTIVITÉ ADMIN (Priorité Moyenne)

### 3.1 ✅ Graphiques statistiques dashboard

**Fichiers à créer/modifier :**
- `src/app/admin/page.tsx` (modifier)
- `src/components/admin/charts/SubscriptionChart.tsx` (nouveau)
- `src/components/admin/charts/RevenueChart.tsx` (nouveau)
- `src/components/admin/charts/ReadingChart.tsx` (nouveau)

**Bibliothèque :** Recharts ou Chart.js

**Graphiques :**
1. Évolution abonnements (ligne, 12 derniers mois)
2. Revenus par mois (barres)
3. Top éditions lues (barres horizontales)
4. Répartition par type d'abonnement (pie)

---

### 3.2 ✅ Recherche utilisateurs avancée

**Fichiers à modifier :**
- `src/app/admin/subscribers/page.tsx`
- `src/components/admin/UserSearch.tsx` (nouveau)

**Critères de recherche :**
- Nom, email (texte libre)
- Rôle (select)
- Statut abonnement (actif/expiré/aucun)
- Date d'inscription (range)
- Entreprise (select pour COMPTE_ENTREPRISE)

---

### 3.3 ✅ Export CSV complet

**Fichiers à créer :**
- `src/app/api/admin/export/subscribers/route.ts` (nouveau)
- `src/app/api/admin/export/subscriptions/route.ts` (nouveau)
- `src/lib/utils/csvExport.ts` (nouveau)

**Spécifications :**
```typescript
// csvExport.ts
export function generateCSV<T>(
  data: T[], 
  columns: { key: keyof T; header: string }[]
): string;

export function downloadCSV(content: string, filename: string): void;
```

---

### 3.4 ✅ Modification rôles utilisateurs

**Fichiers à modifier :**
- `src/app/admin/users/[id]/page.tsx`
- `src/app/api/admin/users/[id]/role/route.ts` (nouveau)

**Spécifications :**
- Dropdown pour changer le rôle
- Confirmation avant changement
- Log de l'action (AdminActionLog)
- Restrictions : SUPER_ADMIN seul peut promouvoir en SUPER_ADMIN

---

### 3.5 ✅ Page FAQ

**Fichiers à créer :**
- `src/app/faq/page.tsx` (nouveau)
- `src/components/FAQ.tsx` (nouveau)

**Sections FAQ :**
1. Abonnement et paiement
2. Lecture des éditions
3. Compte entreprise
4. Problèmes techniques
5. Contact support

---

### 3.6 ✅ Suivi soumissions manuelles (côté user)

**Fichiers à créer :**
- `src/app/subscriptions/submissions/page.tsx` (nouveau)
- `src/components/subscriptions/SubmissionTracker.tsx` (nouveau)

**Statuts affichés :**
- ⏳ En attente de validation
- ✅ Approuvée (avec date d'activation)
- ❌ Rejetée (avec motif)

---

## 🟢 PHASE 4 : POLISH & EXTRAS (Priorité Basse)

### 4.1 ✅ Section témoignages

**Fichiers à créer :**
- `src/components/Testimonials.tsx` (nouveau)
- `src/app/page.tsx` (intégrer section)

**Spécifications :**
- Carousel avec témoignages
- Photo (optionnel), nom, rôle, entreprise
- Note étoiles

---

### 4.2 ✅ Vérification email

**Fichiers à créer :**
- `src/app/auth/verify-email/page.tsx` (nouveau)
- `src/app/api/auth/verify-email/route.ts` (nouveau)
- `src/app/api/auth/resend-verification/route.ts` (nouveau)

**Template email :** `email-verification`

---

### 4.3 ✅ Préférences notifications

**Fichiers à créer :**
- `src/app/profile/notifications/page.tsx` (nouveau)
- `prisma/schema.prisma` (ajouter NotificationPreferences)

**Options :**
- Nouvelles éditions (oui/non)
- Alertes expiration (oui/non)
- Newsletter (oui/non)
- Fréquence résumé (quotidien/hebdo/jamais)

---

### 4.4 ✅ Historique paiements utilisateur

**Fichiers à créer :**
- `src/app/profile/payments/page.tsx` (nouveau)
- `src/components/profile/PaymentHistory.tsx` (nouveau)

**Affichage :**
- Date, montant, type, statut
- Lien téléchargement facture
- Filtre par année

---

### 4.5 ✅ Rapports entreprise

**Fichiers à créer :**
- `src/app/enterprise/reports/page.tsx` (nouveau)
- `src/components/enterprise/UsageReport.tsx` (nouveau)

**Pour COMPTE_ENTREPRISE :**
- Nombre d'utilisateurs actifs
- Éditions les plus lues
- Temps de lecture moyen
- Export PDF rapport mensuel

---

## 📧 TEMPLATES EMAIL PAR DÉFAUT

> Tous les templates sont configurables via `/admin/emails/templates`
> Ils utilisent le système EmailTemplate avec MJML/HTML et tokens dynamiques.

### Liste des templates à créer :

| Slug | Nom | Trigger | Description |
|------|-----|---------|-------------|
| `welcome` | Bienvenue | INSCRIPTION | Email de bienvenue après inscription |
| `password-reset` | Réinitialisation MDP | MANUEL | Lien de réinitialisation de mot de passe |
| `email-verification` | Vérification email | INSCRIPTION | Lien de vérification email |
| `subscription-confirmation` | Confirmation abonnement | ABONNEMENT_ACTIF | Confirmation activation abonnement |
| `manual-submission-received` | Soumission reçue | MANUEL | Confirmation réception paiement manuel |
| `manual-submission-approved` | Soumission approuvée | ABONNEMENT_ACTIF | Validation abonnement manuel |
| `manual-submission-rejected` | Soumission rejetée | MANUEL | Rejet avec motif |
| `subscription-expiring-7days` | Expiration J-7 | ABONNEMENT_EXPIRE_BIENTOT | Alerte 7 jours avant expiration |
| `subscription-expiring-1day` | Expiration J-1 | ABONNEMENT_EXPIRE_BIENTOT | Alerte 1 jour avant expiration |
| `subscription-expired` | Abonnement expiré | ABONNEMENT_EXPIRE | Notification expiration |
| `new-edition-available` | Nouvelle édition | NOUVELLE_EDITION | Annonce nouvelle édition |
| `enterprise-invitation` | Invitation entreprise | INVITATION_ENTREPRISE | Invitation à rejoindre entreprise |
| `payment-received` | Paiement reçu | PAIEMENT_RECU | Confirmation paiement |
| `payment-failed` | Paiement échoué | PAIEMENT_ECHOUE | Notification échec paiement |

### Fichier seed à créer :
`prisma/seeds/seedEmailTemplates.ts`

Voir documentation complète : [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md)

---

## 📁 STRUCTURE DES FICHIERS À CRÉER

```
src/
├── app/
│   ├── auth/
│   │   ├── forgot-password/page.tsx      # Phase 1
│   │   ├── reset-password/page.tsx       # Phase 1
│   │   └── verify-email/page.tsx         # Phase 4
│   ├── profile/
│   │   ├── security/page.tsx             # Phase 1
│   │   ├── notifications/page.tsx        # Phase 4
│   │   └── payments/page.tsx             # Phase 4
│   ├── dashboard/
│   │   └── history/page.tsx              # Phase 2
│   ├── subscriptions/
│   │   ├── manage/page.tsx               # Phase 2
│   │   └── submissions/page.tsx          # Phase 3
│   ├── faq/page.tsx                      # Phase 3
│   ├── enterprise/
│   │   └── reports/page.tsx              # Phase 4
│   └── api/
│       ├── auth/
│       │   ├── forgot-password/route.ts  # Phase 1
│       │   ├── reset-password/route.ts   # Phase 1
│       │   ├── change-password/route.ts  # Phase 1
│       │   ├── verify-email/route.ts     # Phase 4
│       │   └── resend-verification/route.ts # Phase 4
│       ├── reading-sessions/route.ts     # Phase 2
│       ├── cron/
│       │   └── subscription-alerts/route.ts # Phase 1
│       └── admin/
│           ├── export/
│           │   ├── subscribers/route.ts  # Phase 3
│           │   └── subscriptions/route.ts # Phase 3
│           └── users/[id]/role/route.ts  # Phase 3
├── components/
│   ├── ui/
│   │   ├── Toaster.tsx                   # Phase 1
│   │   ├── PriceDisplay.tsx              # Phase 1
│   │   └── Pagination.tsx                # Phase 2
│   ├── SubscriptionExpiryBanner.tsx      # Phase 1
│   ├── ReadingHistory.tsx                # Phase 2
│   ├── FAQ.tsx                           # Phase 3
│   ├── Testimonials.tsx                  # Phase 4
│   ├── admin/
│   │   ├── UserSearch.tsx                # Phase 3
│   │   └── charts/
│   │       ├── SubscriptionChart.tsx     # Phase 3
│   │       ├── RevenueChart.tsx          # Phase 3
│   │       └── ReadingChart.tsx          # Phase 3
│   ├── onboarding/
│   │   ├── OnboardingModal.tsx           # Phase 2
│   │   └── OnboardingSteps.tsx           # Phase 2
│   ├── subscriptions/
│   │   ├── SubscriptionDetails.tsx       # Phase 2
│   │   ├── SubscriptionActions.tsx       # Phase 2
│   │   └── SubmissionTracker.tsx         # Phase 3
│   ├── profile/
│   │   └── PaymentHistory.tsx            # Phase 4
│   └── enterprise/
│       └── UsageReport.tsx               # Phase 4
├── lib/
│   ├── hooks/
│   │   └── useToast.ts                   # Phase 1
│   └── utils/
│       └── csvExport.ts                  # Phase 3
prisma/
├── schema.prisma                          # Modifications diverses
└── seeds/
    └── seedEmailTemplates.ts             # Templates email
```

---

## ✅ CHECKLIST DE SUIVI

### Phase 1 (Semaine 1)
- [x] 1.1 Réinitialisation mot de passe (Backend OK)
- [x] 1.2 Changement mot de passe (Backend OK)
- [x] 1.3 Harmonisation devises (Components OK)
- [x] 1.4 Système toast (Components OK)
- [~] 1.5 Alertes expiration (Backend OK, Email pending)

### Phase 2 (Semaine 2)
- [x] 2.1 Reprise de lecture (Backend OK)
- [x] 2.2 Historique lecture (Page OK)
- [x] 2.3 Pagination admin (Component OK)
- [x] 2.4 Onboarding (Components OK)
- [x] 2.5 Sidebar rétractable (Component OK)
- [x] 2.6 Page gestion abonnement (Page OK)

### Phase 3 (Semaine 3)
- [x] 3.1 Graphiques dashboard (Backend OK - /api/admin/stats)
- [x] 3.2 Recherche avancée (Backend OK - /api/admin/search)
- [x] 3.3 Export CSV (Backend OK - /api/admin/export)
- [x] 3.4 Modification rôles (Backend OK - /api/admin/users/[id]/role)
- [x] 3.5 Page FAQ (Page OK)
- [x] 3.6 Suivi soumissions (Page OK)

### Phase 4 (Semaine 4)
- [x] 4.1 Témoignages (Frontend Fixed)
- [x] 4.2 Vérification email (Page OK)
- [x] 4.3 Préférences notifications (Backend OK - /api/auth/preferences)
- [x] 4.4 Historique paiements (Backend OK - /api/payments/history)
- [x] 4.5 Rapports entreprise (Backend OK - /api/enterprise/reports)

### Templates Email
- [ ] Créer layout principal
- [ ] Créer 14 templates par défaut
- [ ] Tester tous les templates
- [ ] Configurer automations

---

## 📚 DOCUMENTATION LIÉE

- [EMAIL_TEMPLATES.md](./EMAIL_TEMPLATES.md) - Documentation complète des templates email
- [JOURNAL_TYPES_ET_ACCES_EDITIONS.md](./JOURNAL_TYPES_ET_ACCES_EDITIONS.md) - Types de journaux et accès
- [PROPOSITION_ARCHITECTURE_ROLES.md](../PROPOSITION_ARCHITECTURE_ROLES.md) - Architecture des rôles

---

*Document généré automatiquement - Dernière mise à jour : Décembre 2024*
