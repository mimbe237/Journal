# 📋 PROPOSITION D'ARCHITECTURE COMPLÈTE - SYSTÈME DE RÔLES ET PERMISSONS

**Date:** 13 Décembre 2025  
**Plateforme:** Digital Journal Platform - Gestion de Journal Numérique  
**Niveau:** Architecture Professionnelle & Plan d'Implémentation

---

## 📊 CONTEXTE MÉTIER

La plateforme gère les abonnements et la distribution numérique d'un journal. Elle doit supporter :
- **Abonnés individuels** (achat direct en ligne ou soumission manuelle)
- **Comptes entreprises** (multi-utilisateurs avec facturation groupée)
- **Rôles internes** (Facturation, Support, Super Admin)
- **Administrateurs d'entreprise** (gestion de leur compte seulement)

---

## 🎯 HIÉRARCHIE DES RÔLES PROPOSÉE

```
UTILISATEUR NON AUTHENTIFIÉ
    ↓
    ├─→ ABONNE (Lecteur uniquement)
    │
    └─→ UTILISATEUR_ENTREPRISE (Lecteur + limited access)
            ↓
            └─→ COMPTE_ENTREPRISE (Admin d'entreprise)
                    ↓
                    └─→ SUPPORT (Admin support)
                            ↓
                            └─→ FACTURATION (Admin facturation)
                                    ↓
                                    └─→ SUPER_ADMIN (Contrôle total)
```

---

## 🔐 DÉFINITION DÉTAILLÉE DES RÔLES

### 1️⃣ **ABONNE** (Lecteur - Rôle Actuel)
**Définition:** Utilisateur avec abonnement actif, accès lectures uniquement.

**Permissions:**
- ✅ Lire les éditions disponibles selon son abonnement
- ✅ Consulter son profil et ses paramètres personnels
- ✅ Gérer ses abonnements (renouvellement, annulation)
- ✅ Télécharger/consulter ses reçus
- ✅ Consulter historique de lecture

**Restrictions:**
- ❌ Pas d'accès au panel d'administration
- ❌ Pas de création/modification de contenu
- ❌ Pas d'accès aux données d'autres utilisateurs

**Pages/Routes:**
- `/dashboard` - Tableau de bord personnel
- `/editions` - Catalogue des éditions
- `/subscriptions` - Gestion des abonnements
- `/profile` - Profil utilisateur

---

### 2️⃣ **UTILISATEUR_ENTREPRISE** (Employé d'Entreprise - Rôle Actuel)
**Définition:** Employé d'un compte entreprise avec accès lecteur.

**Permissions:**
- ✅ Lire les éditions selon l'abonnement de l'entreprise
- ✅ Consulter son profil personnel
- ✅ Accéder au dashboard d'entreprise (lecture seule)
- ✅ Voir les statistiques d'usage entreprise (lectures, utilisateurs actifs)

**Restrictions:**
- ❌ Pas de modification de contenu ou paramètres d'entreprise
- ❌ Pas de gestion des utilisateurs
- ❌ Pas d'accès à la facturation

**Pages/Routes:**
- `/enterprise/dashboard` - Vue d'ensemble entreprise (lecture seule)
- `/editions` - Éditions disponibles pour l'entreprise

---

### 3️⃣ **COMPTE_ENTREPRISE** (Admin d'Entreprise - Rôle Actuel)
**Définition:** Administrateur du compte entreprise. Gère son entreprise en isolation complète.

**Permissions:**
- ✅ Gérer tous les utilisateurs de son entreprise (inviter, retirer, modifier rôles)
- ✅ Consulter les statistiques détaillées de son entreprise
- ✅ Gérer les paramètres de son entreprise (profil, domaine autorisé, IP, SSO)
- ✅ Consulter l'historique d'abonnement et facturation de son entreprise
- ✅ Télécharger les factures et rapports d'utilisation
- ✅ Créer/gérer les codes d'invitation pour ses utilisateurs

**Restrictions:**
- ❌ Pas d'accès aux autres comptes entreprises
- ❌ Pas de création/modification d'éditions
- ❌ Pas de gestion des codes promo globaux
- ❌ Pas d'ajout manuel d'abonnés (via support uniquement)

**Pages/Routes:**
- `/enterprise/dashboard` - Dashboard admin entreprise
- `/enterprise/users` - Gestion des utilisateurs
- `/enterprise/settings` - Paramètres d'entreprise
- `/enterprise/billing` - Factures et rapports

---

### 4️⃣ **FACTURATION** ⭐ (NOUVEAU)
**Définition:** Gestionnaire de la facturation et des revenus. Dashboard financier spécialisé.

**Permissions:**
- ✅ **Dashboards Financiers:**
  - Tableau de bord facturation avec KPIs (revenu total, croissance, MRR, ARR)
  - Graphiques d'évolution du chiffre d'affaires
  - Analyse par type d'abonnement (mensuel, annuel, codes promo)
  
- ✅ **Gestion des Abonnements Manuels:**
  - Voir la liste des soumissions manuelles en attente
  - Valider/rejeter les soumissions avec raison
  - Ajouter manuellement des abonnés (individuels ou entreprise)
  - Attribuer automatiquement les abonnements
  
- ✅ **Pièces Justificatives:**
  - Consulter les pièces justificatives uploadées (reçus caisse, bulletins)
  - Télécharger/archiver les documents
  - Exporter les justificatifs pour comptabilité
  
- ✅ **Rapports et Exports:**
  - Générer rapports financiers (PDF, CSV, Excel)
  - Analyse d'évolution des souscriptions par période
  - Trésorier: suivi des paiements et dettes
  - Export pour logiciel comptable (format standard)
  
- ✅ **Gestion des Prix:**
  - Consulter et modifier les tarifs (avec validation SUPER_ADMIN)
  - Historique des changements de prix
  
- ✅ **Gestion des Codes Promo:**
  - Consulter codes promo
  - Voir statistiques d'utilisation
  - Créer codes promo (avec validation SUPER_ADMIN)

**Restrictions:**
- ❌ Pas de suppression définitive de données
- ❌ Pas de création d'éditions
- ❌ Pas de gestion des utilisateurs (autre que soumission manuelle)
- ❌ Pas d'accès aux paramètres techniques (SSO, IP, etc.)

**Pages/Routes:**
```
/admin/billing/
├── dashboard          - Tableau de bord financier
├── submissions        - Abonnements manuels en attente
├── subscribers        - Ajouter manuellement abonné
├── reports            - Générer rapports
├── exports            - Export données comptables
├── prices             - Gestion des tarifs
└── promo-codes        - Codes promo (consultation)
```

---

### 5️⃣ **SUPPORT** ⭐ (NOUVEAU)
**Définition:** Responsable du support client et de la gestion de contenu. Valide les soumissions et ajoute du contenu.

**Permissions:**
- ✅ **Gestion des Abonnements Manuels:**
  - Valider/rejeter les soumissions d'abonnements
  - Consulter les pièces justificatives
  - Communiquer avec le client sur la soumission

- ✅ **Création de Contenu:**
  - Ajouter/éditer/supprimer éditions
  - Gérer les covers des éditions
  - Modifier tous les métadonnées d'édition (titre, date, type)
  - Publier/dépublier éditions

- ✅ **Gestion Utilisateurs:**
  - Ajouter manuellement des abonnés (individuels ou entreprise)
  - Modifier les données utilisateur
  - Réinitialiser les mots de passe
  - Consulter l'historique utilisateur

- ✅ **Gestion Entreprises:**
  - Consulter la liste des comptes entreprises
  - Voir les détails d'une entreprise
  - Aider l'admin entreprise (lecture seule des données)
  - Vérifier les invitations en attente

- ✅ **Codes Promo:**
  - Consulter codes promo
  - Créer/modifier/désactiver codes promo (avec validation SUPER_ADMIN)

- ✅ **Rapports Support:**
  - Générer rapports sur les soumissions
  - Exporter données de support pour analyse

**Restrictions:**
- ❌ Pas d'accès à la facturation
- ❌ Pas de suppression définitive d'utilisateurs
- ❌ Pas de modification des rôles utilisateurs
- ❌ Pas d'accès aux paramètres techniques

**Pages/Routes:**
```
/admin/support/
├── submissions        - Soumissions manuelles à valider
├── editions           - Gestion des éditions
├── users              - Ajouter/modifier utilisateurs
├── enterprises        - Consulter entreprises
├── promo-codes        - Gestion codes promo
└── reports            - Rapports support
```

---

### 6️⃣ **SUPER_ADMIN** (Super Administrateur - Admin Actuel Renommé)
**Définition:** Contrôle total de la plateforme. Seul autorisé pour modifications critiques.

**Permissions:**
- ✅ **Accès Complet:**
  - Toutes les permissions de FACTURATION, SUPPORT
  - Gestion complète des utilisateurs (création, suppression, modification rôles)
  - Gestion complète des entreprises
  - Paramètres techniques (SSO, restrictions IP, domaines)
  
- ✅ **Administratif Critique:**
  - Validation finale des changements de prix
  - Validation finale des codes promo
  - Audit logs complets
  - Sauvegardes et recovery
  - Gestion des intégrations

- ✅ **Gestion Complète:**
  - Suppression définitive de données (avec log)
  - Modification des configurations système
  - Gestion des accès administrateurs

**Restrictions:**
- Aucune (contrôle total)

**Pages/Routes:**
```
/admin/
├── dashboard          - Tableau de bord global
├── super/
│   ├── users          - Gestion complète utilisateurs
│   ├── enterprises    - Gestion complète entreprises
│   ├── settings       - Paramètres système
│   ├── audit-logs     - Journaux d'audit
│   └── backups        - Sauvegardes
├── billing/           - Accès complet facturation
└── support/           - Accès complet support
```

---

## 📁 STRUCTURE DE DONNÉES REQUISES

### 1. Étendre le modèle User
```prisma
model User {
  // ... champs existants
  role              UserRole          // Ajouter: FACTURATION, SUPPORT
  // Existant: ABONNE, ADMIN, COMPTE_ENTREPRISE, UTILISATEUR_ENTREPRISE
}

enum UserRole {
  ABONNE
  UTILISATEUR_ENTREPRISE
  COMPTE_ENTREPRISE
  FACTURATION
  SUPPORT
  SUPER_ADMIN  // Renommer ADMIN en SUPER_ADMIN
}
```

### 2. Nouveau modèle: ManualSubscriptionSubmission
```prisma
model ManualSubscriptionSubmission {
  id                String     @id @default(cuid())
  email             String
  nom               String
  entrepriseId      String?    // NULL si individuel
  type              SubscriptionType
  periode           String     // "2025-01", "2025-01-01"
  montant           Float
  
  // Statut
  statut            SubmissionStatus  // PENDING, APPROVED, REJECTED
  motifRejet        String?
  
  // Pièces justificatives
  pieces            DocumentJustificatif[]
  
  // Métadonnées
  soumisA           DateTime   @default(now())
  validePar         String?    // ID User FACTURATION ou SUPPORT
  valideA           DateTime?
  
  @@map("manual_subscriptions")
}

enum SubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model DocumentJustificatif {
  id                String     @id @default(cuid())
  submissionId      String
  type              String     // "RECU_CAISSE", "BULLETIN_ABONNEMENT"
  fichier           String     // Chemin du fichier
  uploadA           DateTime   @default(now())
  
  submission        ManualSubscriptionSubmission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  
  @@map("justificatifs")
}
```

### 3. Étendre le modèle Subscription
```prisma
model Subscription {
  // ... champs existants
  source            SubscriptionSource  // ONLINE, OFFLINE, CODE_PROMO, etc.
  submissionId      String?             // Référence si manuel
  
  submission        ManualSubscriptionSubmission? @relation(fields: [submissionId], references: [id])
}
```

---

## 🎯 PLAN D'IMPLÉMENTATION LOGIQUE

### **PHASE 1: Préparation (Semaine 1)**
**Objectif:** Structurer la base de données et l'architecture

#### 1.1 - Mise à jour du schéma Prisma
- [ ] Ajouter enum `FACTURATION`, `SUPPORT` à `UserRole`
- [ ] Renommer `ADMIN` → `SUPER_ADMIN`
- [ ] Créer modèles `ManualSubscriptionSubmission` et `DocumentJustificatif`
- [ ] Ajouter colonne `source` à `Subscription`
- [ ] Générer migrations
- [ ] Mettre à jour la base de données

#### 1.2 - Configuration des Permissions
- [ ] Créer utilitaire `permissions.ts` définissant les permissions par rôle
- [ ] Créer middleware `checkPermission()` pour les routes
- [ ] Documenter matrice de permissions accessible

#### 1.3 - Migration des données
- [ ] Renommer tous les rôles `ADMIN` en `SUPER_ADMIN`
- [ ] Assigner les utilisateurs existants aux nouveaux rôles (par entretien)

---

### **PHASE 2: Backend API (Semaine 2-3)**
**Objectif:** Implémenter les endpoints pour chaque rôle

#### 2.1 - API Facturation
```
POST   /api/admin/facturation/soumissions           - Lister soumissions
POST   /api/admin/facturation/soumissions/ajouter   - Ajouter abonné manuel
POST   /api/admin/facturation/soumissions/{id}/approuver - Approuver
POST   /api/admin/facturation/soumissions/{id}/rejeter   - Rejeter
GET    /api/admin/facturation/rapports/finances    - Rapport financier
GET    /api/admin/facturation/rapports/souscriptions - Évolution souscriptions
POST   /api/admin/facturation/rapports/export       - Exporter (CSV/Excel)
GET    /api/admin/facturation/prix                  - Voir tarifs
POST   /api/admin/facturation/prix/{id}             - Modifier (validation SUPER_ADMIN)
GET    /api/admin/facturation/promo-codes           - Consulter codes
```

#### 2.2 - API Support
```
POST   /api/admin/support/soumissions               - Lister soumissions
POST   /api/admin/support/soumissions/{id}/approuver - Approuver
POST   /api/admin/support/editions                  - Créer édition
PUT    /api/admin/support/editions/{id}             - Éditer édition
POST   /api/admin/support/utilisateurs/ajouter      - Ajouter abonné
PUT    /api/admin/support/utilisateurs/{id}         - Modifier utilisateur
GET    /api/admin/support/entreprises               - Lister entreprises
GET    /api/admin/support/promo-codes               - Codes promo
POST   /api/admin/support/promo-codes               - Créer (validation SUPER_ADMIN)
```

#### 2.3 - API Super Admin (Existant + Améliorations)
```
GET    /api/admin/super/audit-logs                  - Logs d'audit
GET    /api/admin/super/utilisateurs                - Gestion complète
DELETE /api/admin/super/utilisateurs/{id}           - Supprimer utilisateur
```

---

### **PHASE 3: Frontend - Dashboards (Semaine 3-4)**
**Objectif:** Créer les interfaces utilisateur par rôle

#### 3.1 - Dashboard Facturation
```
Layout: /admin/facturation/
├── dashboard
│   ├── KPIs (Revenu total, MRR, ARR, Croissance %)
│   ├── Graphiques (Évolution revenu, souscriptions)
│   ├── Tableau dernier abonnements
│   └── Alertes (soumissions en attente)
│
├── soumissions
│   ├── Tableau avec filtres (statut, date, type)
│   ├── Vue détail avec pièces justificatives
│   ├── Buttons: Approuver, Rejeter, Télécharger docs
│   └── Formulaire ajout manuel
│
├── rapports
│   ├── Sélecteur: Financier, Souscriptions, Détaillé
│   ├── Sélecteur: Période (mensuel, trimestriel, annuel)
│   ├── Table avec données
│   └── Buttons: PDF, CSV, Excel
│
├── prix
│   ├── Tableau des tarifs actuels
│   ├── Historique des modifications
│   └── Formulaire modification (désactivé sans SUPER_ADMIN)
│
└── codes-promo
    ├── Tableau avec statistiques d'utilisation
    └── Lien vers gestion (SUPPORT)
```

#### 3.2 - Dashboard Support
```
Layout: /admin/support/
├── soumissions
│   └── (Similar à facturation mais sans rapports financiers)
│
├── editions
│   ├── Liste des éditions
│   ├── Bouton: Ajouter édition
│   ├── Bouton par édition: Modifier cover, Modifier infos
│   └── Bouton: Dépublier
│
├── utilisateurs
│   ├── Tableau utilisateurs
│   ├── Formulaire: Ajouter abonné (individuel/entreprise)
│   ├── Actions: Modifier, Réinitialiser MDP
│   └── Historique utilisateur
│
├── entreprises
│   ├── Liste des entreprises
│   ├── Clic: Voir détails (stats, utilisateurs, invitations)
│   └── Support: Vérifier invitations en attente
│
├── codes-promo
│   ├── Tableau codes avec stats
│   ├── Bouton: Créer code (validation SUPER_ADMIN)
│   └── Actions: Modifier, Désactiver
│
└── rapports
    ├── Soumissions traitées
    ├── Éditions publiées
    └── Utilisateurs ajoutés
```

#### 3.3 - Dashboard Super Admin (Amélioré)
```
Layout: /admin/ (existant)
├── super/
│   ├── utilisateurs
│   │   ├── Tableau complet avec filtres rôles
│   │   ├── Actions: Créer, Modifier, Supprimer
│   │   └── Audit: Qui a créé, quand modifié
│   │
│   ├── entreprises (amélioré)
│   │   ├── Gestion complète
│   │   └── Désactivation/suppression
│   │
│   ├── settings
│   │   ├── Paramètres système
│   │   ├── Configuration SSO global
│   │   └── Tarifs (validation finale)
│   │
│   └── audit-logs
│       ├── Logs de toutes les modifications
│       └── Filtres: Type, utilisateur, date
│
├── facturation/ (accès complet)
├── support/    (accès complet)
└── dashboard   (agrégé: statistiques globales)
```

---

### **PHASE 4: Frontend - Roles & Permissions (Semaine 4)**
**Objectif:** Implémenter l'authentification et l'autorisation frontend

#### 4.1 - Composants UI
- [ ] Créer `<ProtectedRoute>` avec gestion rôles
- [ ] Créer `<RoleBasedButton>` qui se cache si pas de permission
- [ ] Créer `<PermissionGuard>` pour sections sensibles

#### 4.2 - Navigation Dynamique
- [ ] Header: Menu différent selon le rôle (FACTURATION voit `/admin/facturation`, SUPPORT voit `/admin/support`)
- [ ] Sidebar: Routes filtrées par rôle
- [ ] Breadcrumb: Navigation contextuelle

#### 4.3 - Validation Frontend
- [ ] Vérifier permission avant chaque action
- [ ] Afficher message si action non autorisée
- [ ] Redirection automatique si accès refusé

---

### **PHASE 5: Intégrations & Fonctionnalités Avancées (Semaine 5-6)**

#### 5.1 - Gestion des Pièces Justificatives
- [ ] Upload de fichiers (reçus caisse, bulletins)
- [ ] Stockage sécurisé (cloud ou local)
- [ ] Archivage et indexation
- [ ] Téléchargement pour comptabilité

#### 5.2 - Système de Notification
- [ ] Email quand soumission approuvée/rejetée
- [ ] Notification SUPER_ADMIN quand changement validé
- [ ] Dashboard: Notifications en temps réel

#### 5.3 - Rapports Avancés
- [ ] Génération PDF sophistiquée
- [ ] Graphiques interactifs (Chart.js/Recharts)
- [ ] Export multi-formats
- [ ] Scheduling: Rapports automatiques par email

#### 5.4 - Audit Complet
- [ ] Logger chaque action sensible
- [ ] Qui a créé/modifié/supprimé et quand
- [ ] Changelogs pour chaque ressource

---

### **PHASE 6: QA & Déploiement (Semaine 6-7)**

#### 6.1 - Tests
- [ ] Tests unitaires: permissions
- [ ] Tests d'intégration: API avec authentification
- [ ] Tests E2E: Workflows complets par rôle

#### 6.2 - Sécurité
- [ ] Audit de sécurité des permissions
- [ ] Validation CSRF sur formulaires
- [ ] Rate limiting sur API sensibles

#### 6.3 - Déploiement
- [ ] Migration en production
- [ ] Formation utilisateurs
- [ ] Support en phase de transition

---

## 📊 MATRICE DE PERMISSIONS RÉSUMÉE

| Fonctionnalité | ABONNE | USER_ENT | COMP_ENT | FACTURATION | SUPPORT | SUPER_ADMIN |
|---|---|---|---|---|---|---|
| **Lecture** |
| Lire éditions | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Profil personnel | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Dashboard Entreprise** |
| Stats entreprise | ❌ | 🔍 | ✅ | ❌ | 🔍 | ✅ |
| Utilisateurs | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Facturation | ❌ | ❌ | 🔍 | ✅ | 🔍 | ✅ |
| **Administration** |
| Créer édition | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modifier édition | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ajouter abonné manuel | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Codes promo | ❌ | ❌ | ❌ | 🔍 | ✅ | ✅ |
| Rapports financiers | ❌ | ❌ | ❌ | ✅ | 🔍 | ✅ |
| **Critique** |
| Validation prix | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Suppression données | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Légende:** ✅ = Accès complet | 🔍 = Lecture seule | ❌ = Pas d'accès

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Structure des Dossiers
```
src/
├── lib/
│   ├── auth/
│   │   ├── permissions.ts         ⭐ NOUVEAU: Définition des permissions par rôle
│   │   ├── authorization.ts       (existant, à améliorer)
│   │   └── ...
│   └── ...
│
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── facturation/       ⭐ NOUVEAU
│   │   │   │   ├── route.ts
│   │   │   │   ├── soumissions/
│   │   │   │   ├── rapports/
│   │   │   │   └── prix/
│   │   │   │
│   │   │   ├── support/           ⭐ NOUVEAU
│   │   │   │   ├── route.ts
│   │   │   │   ├── soumissions/
│   │   │   │   ├── editions/
│   │   │   │   └── utilisateurs/
│   │   │   │
│   │   │   ├── super/             ⭐ NOUVEAU (amélioré)
│   │   │   │   ├── utilisateurs/
│   │   │   │   ├── audit-logs/
│   │   │   │   └── settings/
│   │   │   │
│   │   │   ├── enterprises/       (existant)
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── admin/
│   │   ├── facturation/           ⭐ NOUVEAU
│   │   │   ├── page.tsx
│   │   │   ├── soumissions/
│   │   │   ├── rapports/
│   │   │   └── ...
│   │   │
│   │   ├── support/               ⭐ NOUVEAU
│   │   │   ├── page.tsx
│   │   │   ├── editions/
│   │   │   ├── utilisateurs/
│   │   │   └── ...
│   │   │
│   │   ├── page.tsx               (dashboard global)
│   │   └── ...
│   │
│   └── ...
│
├── components/
│   ├── admin/
│   │   ├── ProtectedRoute.tsx      ⭐ NOUVEAU
│   │   ├── RoleBasedButton.tsx     ⭐ NOUVEAU
│   │   └── PermissionGuard.tsx     ⭐ NOUVEAU
│   └── ...
│
└── ...
```

---

## 🔒 SÉCURITÉ & BEST PRACTICES

### 1. Validation des Permissions
```typescript
// TOUJOURS vérifier les permissions côté serveur (API)
// Ne jamais faire confiance au frontend

// Exemple middleware:
export async function checkPermission(
  req: NextRequest,
  requiredRole: UserRole | UserRole[]
) {
  const user = await getCurrentUserFromRequest(req);
  
  if (!user) return null; // Non authentifié
  
  const allowed = Array.isArray(requiredRole)
    ? requiredRole.includes(user.role)
    : user.role === requiredRole;
    
  if (!allowed) throw new UnauthorizedError();
  return user;
}
```

### 2. Audit Trail Complet
```typescript
// Logger CHAQUE action sensible
await logEvent({
  type: 'MODIFICATION_PRIX',
  userId: user.id,
  meta: { ancienPrix: 2500, nouveauPrix: 3000, validéPar: admin.id }
});
```

### 3. Validation des Données
- Vérifier que les IDs fournis appartiennent à l'utilisateur
- Exemple: COMPTE_ENTREPRISE ne peut modifier que SON entreprise

---

## 📈 MÉTRIQUES DE SUCCÈS

- ✅ Chaque rôle a accès uniquement à ses fonctionnalités
- ✅ Les permissions sont validées côté serveur
- ✅ Tous les événements sensibles sont loggés
- ✅ Interface claire et intuitive par rôle
- ✅ Rapports financiers générables en < 2s
- ✅ Support peut gérer les soumissions efficacement
- ✅ SUPER_ADMIN a visibilité totale avec audit complet

---

## 📝 RÉSUMÉ EXÉCUTIF

Cette architecture propose une **séparation claire des responsabilités** :

- **FACTURATION** = 💰 Gestion des revenus, rapports, tarifs
- **SUPPORT** = 📞 Gestion du contenu, validation des soumissions, aide client
- **SUPER_ADMIN** = 🔑 Contrôle total, validations critiques, audit
- **COMPTE_ENTREPRISE** = 🏢 Auto-gestion du compte
- **UTILISATEURS** = 👥 Lecteurs uniquement

**Timeline:** 6-7 semaines pour implémentation complète  
**Complexité:** Moyenne (API + Frontend)  
**ROI:** Élevé (meilleure organisation, traçabilité, efficacité)

---

**Prêt à commencer la Phase 1 ? 🚀**
