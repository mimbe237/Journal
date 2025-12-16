# Architecture des Abonnements Entreprise - Proposition Recommandée

## 🎯 Objectif Stratégique

Créer un système B2B où :
1. **L'acheteur (Decision Maker)** = Admin Principal de l'Entreprise
2. **L'entreprise** possède un abonnement global avec N licences
3. **Les utilisateurs** (collaborateurs) peuvent être assignés avec des rôles granulaires
4. **Dashboard d'administration** accessible au premier utilisateur & administrateurs

---

## 📊 Modèle de Données Proposé

### Structure Actuelle (à enrichir)

```
EnterpriseAccount (1 compte = 1 structure)
├── nom, contactEmail, siren, ...
├── nombreUtilisateursInclus (licences totales)
├── Subscription[] (abonnement du compte)
└── User[] (collaborateurs assignés)

User (UTILISATEUR_ENTREPRISE)
├── nom, email, role (voir ci-dessous)
├── enterpriseAccountId (FK)
├── isAdminPrimaire: boolean ← [NOUVEAU]
├── dateAssignment: Date
└── status: ACTIF | INVITÉ | SUSPENDU

Subscription (linked to EnterpriseAccount)
├── type: MENSUEL | ANNUEL | CUSTOM
├── statut: ACTIF | EXPIRE | SUSPENDU
├── dateDebut, dateFin
├── montant, devise
└── adminAssignedId: UUID ← [NOUVEAU] Qui a créé/modifié
```

### Nouvel Enum pour Rôles Entreprise

```typescript
enum EnterpriseUserRole {
  // Admin Primaire : celui qui a acheté
  ADMIN_PRIMAIRE = "ADMIN_PRIMAIRE",
  
  // Autres administrateurs
  ADMIN_SECONDAIRE = "ADMIN_SECONDAIRE",
  
  // Managers (peuvent inviter, voir rapports)
  MANAGER = "MANAGER",
  
  // Utilisateurs standard (lecture seule ou accès complet?)
  UTILISATEUR = "UTILISATEUR",
  
  // Rôle suspendu
  SUSPENDU = "SUSPENDU"
}
```

---

## 🔑 Règles de Métier (Best Practices)

### 1. **Achat d'Abonnement Entreprise**

**Workflow :**
```
Client achète plan Entreprise (via Stripe/Paiement)
  ↓
Admin (SUPER_ADMIN) crée EnterpriseAccount
  ↓
Admin saisit "Email Admin Primaire" (celui du décideur)
  ↓
Invitation envoyée à cet email (JWT token)
  ↓
Décideur accepte → User créé avec role ADMIN_PRIMAIRE
  ↓
Dashboard Entreprise accessible
  ↓
Admin Primaire peut inviter N collaborateurs (jusqu'à limite)
```

### 2. **Hiérarchie et Permissions**

| Rôle | Peut lire | Peut inviter | Peut modifier config | Peut gérer paiement |
|------|----------|-------------|-------------------|------------------|
| **ADMIN_PRIMAIRE** | ✅ Tout | ✅ Illimité | ✅ Oui | ✅ Oui (avec MFA) |
| **ADMIN_SECONDAIRE** | ✅ Tout | ✅ Oui | ✅ Oui | ❌ Non |
| **MANAGER** | ✅ Tout | ✅ Oui | ❌ Non | ❌ Non |
| **UTILISATEUR** | ✅ Données | ❌ Non | ❌ Non | ❌ Non |

### 3. **Licences et Allocation**

```typescript
// À stocker dans EnterpriseAccount
{
  nombreUtilisateursInclus: 5,           // Total acheté
  nombreUtilisateursActifs: 2,           // Actuels
  nombreUtilisateursInvites: 1,          // En attente
  
  // Calcul : Active + Invités ne doivent pas > Inclus
  licencesDisponibles = Inclus - Actifs - Invités
}
```

### 4. **Cycle de Vie d'une Assignation Utilisateur**

```
INVITÉ (email envoyé)
  ↓ [Utilisateur accepte]
ACTIF (peut se connecter)
  ↓ [Admin pause/révoque]
SUSPENDU (pas d'accès)
  ↓ [Suppression logique]
SUPPRIMÉ (archivé, pas d'accès)
```

---

## 🎛️ Dashboard Admin Entreprise (Fonctionnalités Essentielles)

### Onglets Principaux

#### 1️⃣ **Vue d'ensemble**
```
┌─────────────────────────────────────┐
│ 📊 Abonnement Entreprise             │
├─────────────────────────────────────┤
│ Plan : Annuel | Statut : ACTIF      │
│ Valide : 01/01/2025 → 31/12/2025    │
│ Licences : 3/5 utilisées             │
│ Renouvellement auto : Activé ✓       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👥 Utilisateurs                     │
├─────────────────────────────────────┤
│ • Alice (Admin Primaire) - ACTIF    │
│ • Bob (Manager) - ACTIF              │
│ • Charlie (Utilisateur) - INVITÉ    │
│ • Dave (Utilisateur) - SUSPENDU     │
│                                      │
│ [+ Inviter un utilisateur]          │
└─────────────────────────────────────┘
```

#### 2️⃣ **Gestion des Utilisateurs**
```
Actions possibles pour Admin Primaire :

[Inviter] - Envoyer lien à nouveau collaborateur
[Modifier] - Changer rôle, suspension
[Révoquer] - Arrêter accès immédiatement
[Restaurer] - Réactiver utilisateur suspendu
[Réinitialiser] - Envoyer lien reset password
```

#### 3️⃣ **Abonnement et Facturation**
```
• Visualiser plan actuel
• Historique des factures (PDF)
• Modifier méthode de paiement
• Renouvellement auto (on/off)
• Upgrade/Downgrade plan (avec prorata)
```

#### 4️⃣ **Activité et Audit**
```
📋 Log de tous les changements :
- 15/12 14:30 : Alice a invité Bob
- 15/12 12:00 : Charlie a suspendu Dave
- 14/12 09:15 : Abonnement renouvelé
```

#### 5️⃣ **Paramètres Avancés** (admin seulement)
```
• Domaine autorisé (SSO)
• Plages IP whitelist
• Authentification 2FA obligatoire
• Logo/Branding personnalisé
```

---

## 🛠️ Implémentation sur le Système Actuel

### Étapes Concrètes

#### **Phase 1 : Schéma Prisma**
```prisma
model EnterpriseAccount {
  id                          String    @id @default(cuid())
  nom                         String
  contactEmail                String
  contactTelephone            String?
  numeroSiret                 String?
  
  // ===== NOUVEAU =====
  adminPrimaireId             String?   @unique  // FK to User (ADMIN_PRIMAIRE)
  adminPrimaireEmail          String?   // Email invité si pas encore accepté
  
  // Licence & Abonnement
  nombreUtilisateursInclus    Int       @default(5)
  nombreUtilisateursActifs    Int       @default(0)
  nombreUtilisateursInvites   Int       @default(0)
  
  // Statut
  actif                       Boolean   @default(true)
  
  // Audit
  createdAt                   DateTime  @default(now())
  updatedAt                   DateTime  @updatedAt
  createdBy                   String?   // Admin SUPER_ADMIN qui a créé
  
  // Relations
  users                       User[]
  subscriptions               Subscription[]
  invitations                 EnterpriseInvitation[]
  auditLogs                   EnterpriseAuditLog[]
}

model User {
  // ... champs existants ...
  
  // ===== NOUVEAU =====
  enterpriseRole              EnterpriseUserRole? // ADMIN_PRIMAIRE, ADMIN_SECONDAIRE, etc.
  isAdminEnterprise           Boolean   @default(false) // true si role in [ADMIN_*]
  dateAssignmentEnterprise    DateTime? // Quand assigné à l'entreprise
  statusEnterprise            String    @default("ACTIF") // ACTIF | INVITÉ | SUSPENDU | SUPPRIMÉ
  lastActivityAt              DateTime? // Dernière connexion
  
  // Audit
  assignedById                String?   // Qui l'a assigné à l'entreprise
  suspendedReason             String?   // Raison de suspension
  suspendedAt                 DateTime?
}

model Subscription {
  // ... champs existants ...
  
  // ===== NOUVEAU =====
  adminAssignedId             String?   // Qui a modifié la dernière fois
  adminAssignedAt             DateTime  @updatedAt
}

// ===== NOUVEAU =====
model EnterpriseInvitation {
  id                          String    @id @default(cuid())
  enterpriseAccountId         String    @relation(fields: [enterpriseId], references: [id])
  enterpriseId                String
  
  email                       String
  role                        EnterpriseUserRole @default("UTILISATEUR")
  
  token                       String    @unique
  expiresAt                   DateTime
  acceptedAt                  DateTime?
  acceptedByUserId            String?
  
  createdAt                   DateTime  @default(now())
  createdBy                   String    // Admin qui a envoyé l'invite
  
  @@unique([enterpriseId, email]) // Pas de double invit
  @@index([token])
  @@index([enterpriseId])
}

model EnterpriseAuditLog {
  id                          String    @id @default(cuid())
  enterpriseAccountId         String    @relation(fields: [enterpriseId], references: [id])
  enterpriseId                String
  
  action                      String    // "INVITE_SENT", "USER_ADDED", "ROLE_CHANGED", etc.
  targetUserId                String?   // Qui est affecté
  changedFields               Json?     // {role: "UTILISATEUR" → "ADMIN_SECONDAIRE"}
  reason                      String?
  
  performedBy                 String    // Qui a fait l'action
  performedAt                 DateTime  @default(now())
  ipAddress                   String?
  userAgent                   String?
  
  @@index([enterpriseId])
  @@index([performedBy])
  @@index([targetUserId])
}

enum EnterpriseUserRole {
  ADMIN_PRIMAIRE
  ADMIN_SECONDAIRE
  MANAGER
  UTILISATEUR
  SUSPENDU
}
```

#### **Phase 2 : Workflow d'Achat**

**API : `POST /api/enterprise/subscriptions/new`**
```typescript
// Admin SUPER_ADMIN crée un compte + invite admin primaire
{
  "nom": "Acme Corp",
  "contactEmail": "acme@company.com",
  "adminPrimaireEmail": "alice@company.com",  // ← Clé
  "nombreUtilisateursInclus": 5,
  "type": "ANNUEL",
  "montant": 5000,
  "dateDebut": "2025-01-01",
  "dateFin": "2025-12-31"
}

→ Crée EnterpriseAccount + Subscription
→ Envoie invitation à alice@company.com
→ Alice accepte → User créé (ADMIN_PRIMAIRE)
→ Alice peut alors inviter collaborateurs
```

#### **Phase 3 : Dashboard Entreprise**

**Route : `/enterprise/dashboard`** (accessible à ADMIN_PRIMAIRE, ADMIN_SECONDAIRE)

```typescript
// Composants principaux :
- OverviewCard (abonnement, licences)
- UsersManagementTable (liste + actions)
- InviteModal (formulaire)
- AuditLog (historique)
- BillingSection (factures, renouvellement)
```

---

## ✅ Checklist d'Implémentation

### Backend
- [ ] Migrer schema Prisma (EnterpriseInvitation, EnterpriseAuditLog, champs User)
- [ ] Créer `enterpriseService.ts` :
  - `inviteEnterpriseUser()`
  - `acceptInvitation(token)`
  - `changeUserRole()`
  - `suspendUser()`
  - `getEnterpriseStats()`
- [ ] Route POST `/api/enterprise/users/invite` (auth : ADMIN_PRIMAIRE+)
- [ ] Route POST `/api/enterprise/users/{id}/role` (auth : ADMIN_PRIMAIRE)
- [ ] Route GET `/api/enterprise/audit-logs` (auth : ADMIN_PRIMAIRE+)
- [ ] Sécurité : vérifier `enterpriseId` match à chaque requête

### Frontend
- [ ] Page `/enterprise/dashboard` (layout + tabs)
- [ ] Composant `UsersPanel` (table + CRUD)
- [ ] Modal `InviteUser` 
- [ ] Modal `ChangeRole`
- [ ] Toasts/Notifications pour actions

### Sécurité & Audit
- [ ] Logging de chaque action (EnterpriseAuditLog)
- [ ] Rate limiting sur invitations (5/jour?)
- [ ] Validation email (domaine entreprise?)
- [ ] MFA optionnel pour ADMIN_PRIMAIRE
- [ ] Soft-delete des utilisateurs (jamais purger)

---

## 🔐 Aspects de Sécurité Critiques

### ✓ À Implémenter Absolument

1. **Isolation des Données**
   ```typescript
   // TOUJOURS vérifier enterpriseId
   const user = await getUser(userId);
   if (user.enterpriseAccountId !== requestingEnterprise.id) {
     throw new UnauthorizedError("Vous n'avez pas accès à cet utilisateur");
   }
   ```

2. **Hiérarchie Stricte**
   ```typescript
   // Seul ADMIN_PRIMAIRE peut révoquer tous les admins
   if (targetRole === "ADMIN_PRIMAIRE" && currentUser.enterpriseRole !== "ADMIN_PRIMAIRE") {
     throw new ForbiddenError("Seul l'admin primaire peut modifier les admins primaires");
   }
   ```

3. **Audit Complet**
   ```typescript
   // Chaque modification → EnterpriseAuditLog
   await logEnterpriseAction({
     enterpriseId,
     action: "ROLE_CHANGED",
     targetUserId: userId,
     changedFields: { role: oldRole, newRole },
     performedBy: currentUserId,
     ipAddress: req.ip,
     userAgent: req.headers['user-agent']
   });
   ```

4. **Invitation Sécurisée**
   - Token JWT expirant (48h)
   - One-time use
   - Email verification requis

---

## 📈 Évolutions Futures

1. **SSO Entreprise** (SAML/OAuth)
   ```prisma
   enterpriseAccount {
     ssoEnabled: boolean
     ssoProvider: "SAML" | "OAUTH" | null
     ssoConfig: JSON  // Métadonnées
   }
   ```

2. **Authentification 2FA Obligatoire** pour admins

3. **Quotas par rôle**
   ```
   ADMIN_PRIMAIRE → Invitations illimitées
   ADMIN_SECONDAIRE → Max 10 invitations
   MANAGER → Max 5 invitations
   ```

4. **Webhooks** pour sync avec systèmes clients
   - `enterprise.user.invited`
   - `enterprise.user.activated`
   - `enterprise.subscription.renewed`

---

## 📚 Exemples de Flows

### Scénario 1 : Achat + Onboarding

```
1. Commercial crée compte Acme (SUPER_ADMIN)
   POST /api/admin/enterprises
   {
     nom: "Acme",
     adminPrimaireEmail: "alice@acme.com",
     ...
   }

2. Système envoie email à alice@acme.com
   "Bienvenue sur le journal premium Acme!"
   [Activer mon compte]

3. Alice clique → Accepte invitation
   GET /api/enterprise/invitations/{token}/accept

4. Alice accède dashboard
   /enterprise/dashboard
   → Voit 5 licences, 0 utilisateurs

5. Alice invite Bob, Charlie
   POST /api/enterprise/users/invite
   { email: "bob@acme.com", role: "MANAGER" }
   { email: "charlie@acme.com", role: "UTILISATEUR" }

6. Emails envoyés → Bob/Charlie acceptent

7. Alice = 1/5, Bob = 1/5, Charlie = 1/5 → 3/5 utilisées
```

### Scénario 2 : Gestion des Rôles

```
Alice (ADMIN_PRIMAIRE) veut promouvoir Bob → ADMIN_SECONDAIRE

PUT /api/enterprise/users/{bobId}/role
{
  role: "ADMIN_SECONDAIRE",
  reason: "Responsable RH"
}

✓ AuditLog enregistré
✓ Email notification à Bob
✓ Bob accède maintenant à gestion avancée
```

---

## 🎯 Résumé Recommandations

| Aspect | Recommandation |
|--------|---|
| **Admin Primaire** | User créé à l'accept de l'invitation, role ADMIN_PRIMAIRE |
| **Licences** | Comptées : actifs + invités, validation à l'ajout |
| **Rôles** | 4 niveaux (ADMIN_PRIMAIRE, ADMIN_SEC, MANAGER, USER) |
| **Invitations** | Token expirant, one-time, avec audit complet |
| **Dashboard** | Accessible à ADMIN_PRIMAIRE + ADMIN_SECONDAIRE |
| **Audit** | Logging complet de chaque action + IP + UserAgent |
| **Sécurité** | MFA optionnel, isolation stricte, rate limiting |
| **Migration** | Pas de rupture de l'existant, ajouts progressifs |

---

**Version** : 1.0 (16 Déc 2025)
**Statut** : Proposition Finalisée - Prêt pour Review
