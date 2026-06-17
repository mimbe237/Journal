# Cahier des Charges Fonctionnel — Éditions Invitées (Guest Access)

**Version :** 1.0  
**Date :** 17 juin 2026  
**Statut :** Prêt pour implémentation  
**Portée :** Module "Éditions Invitées" — administration + lecture publique sans authentification

---

## 1. Contexte et Objectif

### 1.1 Problème à résoudre

La plateforme est actuellement entièrement réservée aux abonnés authentifiés. Il n'existe aucun mécanisme pour exposer gratuitement une édition à des lecteurs non-inscrits, ce qui limite la visibilité du journal et la conversion vers l'abonnement.

### 1.2 Objectif fonctionnel

Permettre à l'équipe éditoriale de configurer, pour chaque jour de la semaine (lundi à dimanche), **une édition "invitée"** — c'est-à-dire une édition réelle du catalogue accessible gratuitement via un lien public, sans connexion requise.

Ce dispositif sert de **vitrine commerciale** : un lecteur non-abonné peut découvrir le contenu du journal avec l'expérience de lecture complète, puis être incité à s'abonner.

### 1.3 Périmètre

Deux livrables distincts :

| # | Livrable | Description |
|---|----------|-------------|
| 1 | **Page d'administration "Invité"** | Interface admin pour configurer les 7 slots hebdomadaires |
| 2 | **Page de lecture publique** | Lecteur en mode livre, sans authentification, accessible via un lien unique |

---

## 2. Concepts Métier

### 2.1 Édition Invitée (GuestEdition)

Une **édition invitée** est une association entre :
- Un **jour de la semaine** (lundi à dimanche, représenté par un entier 1–7)
- Une **édition réelle** du catalogue (`Edition` existante en base)
- Un **token public unique** (slug URL-safe généré automatiquement)
- Une **date d'assignation** (horodatage de la dernière modification du lien)

Il existe **exactement 7 slots** permanents (un par jour de la semaine). Ils ne sont pas créés ou supprimés, mais mis à jour. Un slot peut être vide (aucune édition assignée) ou actif (édition assignée).

### 2.2 Lien public

Le lien public est de la forme :

```
/lire/invite/[token]
```

- `token` : identifiant opaque généré automatiquement lors de l'assignation d'une édition à un slot
- Le token change à chaque nouvelle assignation, ce qui invalide les anciens liens
- La page accessible via ce lien **ne requiert aucune authentification**

### 2.3 Référence d'édition

La "référence de l'édition" est l'`id` Prisma d'une édition existante dans le catalogue (`Edition`). L'admin sélectionne cette édition depuis la liste des éditions disponibles (non supprimées).

### 2.4 Date du tableau

La **date** affichée dans le tableau de configuration correspond à la **date de la dernière mise à jour du lien** (horodatage de la dernière assignation), pas à la date de publication de l'édition. Elle indique "quand le lien a été configuré pour ce jour".

---

## 3. Modèle de Données

### 3.1 Nouveau modèle Prisma : `GuestEdition`

```prisma
/// Édition invitée : associe un jour de la semaine à une édition accessible publiquement.
/// Il existe exactement 5 enregistrements (un par jour ouvrable, lundi=1 à vendredi=5).
model GuestEdition {
  id          String    @id @default(cuid())
  dayOfWeek   Int       @unique // 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 7=Dimanche
  dayLabel    String    // "Lundi", "Mardi", etc. (dénormalisé pour lecture rapide)
  editionId   String?   // FK vers Edition (null = slot vide)
  publicToken String    @unique @default(cuid()) // Slug public URL
  assignedAt  DateTime? // Date de la dernière assignation
  isActive    Boolean   @default(true) // false = slot désactivé temporairement

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  edition     Edition?  @relation(fields: [editionId], references: [id], onDelete: SetNull)

  @@index([dayOfWeek])
  @@index([publicToken])
  @@map("guest_editions")
}
```

**Note :** La relation inverse `guestEditions GuestEdition[]` doit être ajoutée au modèle `Edition` existant.

### 3.2 Initialisation des données

Au premier démarrage (migration), 7 enregistrements sont créés via un seed :

```sql
INSERT INTO guest_editions (id, day_of_week, day_label, edition_id, public_token, is_active, created_at, updated_at)
VALUES
  (cuid(), 1, 'Lundi',    NULL, cuid(), true, NOW(), NOW()),
  (cuid(), 2, 'Mardi',    NULL, cuid(), true, NOW(), NOW()),
  (cuid(), 3, 'Mercredi', NULL, cuid(), true, NOW(), NOW()),
  (cuid(), 4, 'Jeudi',    NULL, cuid(), true, NOW(), NOW()),
  (cuid(), 5, 'Vendredi', NULL, cuid(), true, NOW(), NOW()),
  (cuid(), 6, 'Samedi',   NULL, cuid(), true, NOW(), NOW()),
  (cuid(), 7, 'Dimanche', NULL, cuid(), true, NOW(), NOW());
```

---

## 4. Fonctionnalité 1 — Page d'Administration "Invité"

### 4.1 Accès et position dans le menu

- **Route :** `/admin/editions/invite`
- **Position dans la sidebar :** Section "Éditions", après "Import en masse"
- **Label :** "Invité" (avec icône cadeau ou lien)
- **Rôles autorisés :** `SUPER_ADMIN`, `SUPPORT` (le SUPPORT a déjà accès aux éditions)

### 4.2 Interface — Vue générale

La page présente :
1. Un **en-tête** avec titre "Éditions invitées" et description
2. Un **tableau de 7 lignes** (lundi à dimanche)
3. Un **panneau de sélection d'édition** (modal ou drawer) pour chaque slot

### 4.3 Tableau des slots hebdomadaires

Le tableau contient les colonnes suivantes :

| Colonne | Description |
|---------|-------------|
| **Jour** | Nom du jour (Lundi, Mardi, Mercredi, Jeudi, Vendredi) |
| **Date de mise à jour** | Horodatage de la dernière assignation (`assignedAt`). Vide si aucune édition n'est encore assignée. Format : `DD/MM/YYYY à HH:mm` |
| **Édition assignée** | Titre de l'édition référencée + sa date de publication. Affiche "— Non configuré —" si slot vide |
| **Lien public** | URL complète du lecteur public. Bouton de copie. Grisé si slot vide |
| **Actions** | Bouton "Modifier" pour ouvrir le sélecteur d'édition. Bouton "Effacer" pour vider le slot |

**État visuel des lignes :**
- Slot actif avec édition : ligne normale
- Slot vide : ligne légèrement atténuée avec mention "Non configuré"
- Slot désactivé (`isActive=false`) : ligne avec badge "Désactivé"

### 4.4 Sélecteur d'édition (Modal)

Lors du clic sur "Modifier" d'un slot :

1. **Ouverture d'une modal** avec :
   - Titre : "Configurer l'édition — [Jour]"
   - Champ de recherche textuel (filtre par titre, date de publication)
   - Liste des éditions disponibles (non supprimées), triées par date de publication décroissante
   - Chaque item affiche : titre, date de publication, type (QUOTIDIEN, HEBDOMADAIRE...), image de une si disponible
   - Mise en évidence de l'édition actuellement sélectionnée pour ce slot
   - Bouton "Sélectionner" sur chaque item
   - Bouton "Annuler" pour fermer sans sauvegarder

2. **Lors de la sélection** :
   - L'`editionId` du slot est mis à jour
   - Le `publicToken` est **régénéré** (le nouveau lien invalide l'ancien)
   - `assignedAt` est mis à jour avec l'horodatage courant
   - L'interface se met à jour immédiatement (optimistic update)

### 4.5 Génération automatique du lien public

Le lien public est construit côté serveur ainsi :

```
[NEXT_PUBLIC_APP_URL]/lire/invite/[publicToken]
```

Exemple : `https://monjournal.cm/lire/invite/clx8f2k3j0001abcd5678efgh`

Le token est un CUID opaque. Il ne contient aucune information sur l'édition, le jour ou la date.

### 4.6 Fonctionnalités secondaires de la page admin

- **Bouton "Copier le lien"** : copie l'URL dans le presse-papier, avec feedback visuel (icône ✓)
- **Bouton "Effacer"** : vide le slot (met `editionId` à `null`), avec confirmation simple
- **Badge "Lien actif / Inactif"** : indique si le slot est fonctionnel
- **Bouton "Aperçu"** : ouvre le lien public dans un nouvel onglet

---

## 5. Fonctionnalité 2 — Page de Lecture Publique

### 5.1 Route et paramètre

- **Route :** `/lire/invite/[token]`
- **Paramètre :** `token` — le `publicToken` du slot `GuestEdition`
- **Authentification requise :** Aucune — page entièrement publique

### 5.2 Comportement au chargement

1. Le serveur résout le `token` → cherche le `GuestEdition` correspondant
2. Vérifications :
   - Le token existe
   - `isActive = true`
   - `editionId` est non-null (un slot vide ne peut pas être consulté)
3. Si une vérification échoue → page d'erreur appropriée (voir §5.5)
4. Si tout est valide → rendu du lecteur avec l'édition correspondante

### 5.3 Interface du lecteur public

Le lecteur public réutilise le composant `EditionReader` existant avec les adaptations suivantes :

**Identique à l'existant :**
- Mode feuilletage 3D (flip)
- Mode page simple / double
- Zoom, rotation
- Thème clair / sombre / sépia
- Navigation clavier et tactile
- Barre de progression
- Miniatures

**Différent / retiré pour le mode invité :**
- Pas de tracking `POST /api/editions/[id]/track` (pas d'utilisateur identifié)
- Pas de persistance des marque-pages (ou stockage purement localStorage sans lien compte)
- Pas de bouton "Partager la page" renvoyant vers `/editions/[id]` (lien privé)
- Pas d'accès au kiosque abonné

**Ajouté pour le mode invité :**
- **Bandeau supérieur de conversion** : message invitant à s'abonner pour un accès illimité, avec bouton "S'abonner" (lien vers la page d'abonnement publique)
- **En-tête identifiant le journal** : logo/nom du journal + "Lecture gratuite"
- **Filigrane discret** sur chaque page : mention "Édition invitée — [nom du journal]"

### 5.4 API dédiée au lecteur public (sans auth)

Deux nouvelles routes API publiques, distinctes des routes abonnés :

#### `GET /api/invite/[token]`
Retourne les métadonnées de l'édition associée au token.

**Logique :**
```
1. Chercher GuestEdition WHERE publicToken = token AND isActive = true
2. Si non trouvé → 404
3. Si editionId est null → 404 "Aucune édition configurée pour ce créneau"
4. Charger Edition WHERE id = editionId AND deletedAt IS NULL
5. Retourner { id, titre, datePublication, type, nombrePages }
```

**Réponse 200 :**
```json
{
  "edition": {
    "id": "clx...",
    "titre": "Cameroon Tribune du 17 juin 2026",
    "datePublication": "2026-06-17T00:00:00.000Z",
    "type": "QUOTIDIEN",
    "nombrePages": 24
  },
  "guestInfo": {
    "dayLabel": "Mardi",
    "isGuestAccess": true
  }
}
```

#### `GET /api/invite/[token]/pages/[page]/image`
Sert l'image d'une page de l'édition invitée.

**Logique :**
```
1. Résoudre token → GuestEdition → Edition (même vérifications que ci-dessus)
2. Valider pageNumber (1 ≤ page ≤ nombrePages)
3. Chercher l'image dans le stockage (webp ou png, même chemin que le reader abonné)
4. Retourner l'image avec Cache-Control: public, max-age=3600
```

**Sécurité :** Le token opaque empêche l'accès arbitraire à n'importe quelle édition. Sans token valide, aucune image n'est servie.

### 5.5 Pages d'erreur

| Situation | Message affiché |
|-----------|----------------|
| Token inexistant | "Ce lien de lecture n'existe pas ou a expiré." |
| Slot sans édition | "Aucune édition n'est disponible pour ce créneau." |
| Édition supprimée | "Cette édition n'est plus disponible." |
| Slot désactivé | "Ce lien de lecture a été temporairement désactivé." |

Chaque page d'erreur contient un bouton "Découvrir nos abonnements" → lien vers la page publique d'abonnement.

---

## 6. Routes API Back-Office (Admin)

### `GET /api/admin/guest-editions`
Retourne les 5 slots avec leurs éditions associées.

**Réponse :**
```json
[
  {
    "id": "...",
    "dayOfWeek": 1,
    "dayLabel": "Lundi",
    "editionId": "clx...",
    "edition": {
      "titre": "Cameroon Tribune du 16 juin 2026",
      "datePublication": "2026-06-16T00:00:00.000Z",
      "cheminImageUne": "..."
    },
    "publicToken": "clx...",
    "publicUrl": "https://monjournal.cm/lire/invite/clx...",
    "assignedAt": "2026-06-16T08:30:00.000Z",
    "isActive": true
  },
  ...
]
```

### `PATCH /api/admin/guest-editions/[id]`
Met à jour un slot (assignation d'une édition ou effacement).

**Corps (assignation) :**
```json
{ "editionId": "clx..." }
```

**Corps (effacement) :**
```json
{ "editionId": null }
```

**Logique :**
- Si `editionId` fourni : vérifier que l'édition existe et n'est pas supprimée
- Régénérer `publicToken` (nouveau CUID) pour invalider les anciens liens
- Mettre à jour `assignedAt = now()`
- Logger l'action dans `SystemEvent` (type : `AUTRE`, meta : `{ action: "GUEST_EDITION_UPDATED", dayOfWeek, editionId }`)

### `GET /api/admin/editions` (existant, réutilisé)
Utilisé par la modal de sélection pour lister les éditions disponibles.  
Paramètres de filtrage : `q` (recherche textuelle), `page`, `limit`.

---

## 7. Architecture des Fichiers à Créer

```
src/
├── app/
│   ├── admin/
│   │   └── editions/
│   │       └── invite/
│   │           └── page.tsx              ← Page admin de configuration
│   │
│   ├── lire/
│   │   └── invite/
│   │       └── [token]/
│   │           └── page.tsx              ← Page de lecture publique (no auth)
│   │
│   └── api/
│       ├── admin/
│       │   └── guest-editions/
│       │       ├── route.ts              ← GET (liste) 
│       │       └── [id]/
│       │           └── route.ts          ← PATCH (update slot)
│       │
│       └── invite/
│           └── [token]/
│               ├── route.ts              ← GET (métadonnées édition invitée)
│               └── pages/
│                   └── [page]/
│                       └── image/
│                           └── route.ts  ← GET (image page, public)
│
├── modules/
│   └── guest-editions/
│       └── guestEditionService.ts        ← Logique métier (résolution token, etc.)
│
prisma/
├── migrations/
│   └── [timestamp]_add_guest_editions/
│       └── migration.sql
└── seeds/
    └── seedGuestEditions.ts              ← Seed des 5 slots initiaux
```

---

## 8. Modifications des Fichiers Existants

### 8.1 `prisma/schema.prisma`
- Ajout du modèle `GuestEdition`
- Ajout de `guestEditions GuestEdition[]` sur le modèle `Edition`

### 8.2 `src/components/admin/AdminSidebar.tsx`
- Ajout dans la section "Éditions" (SUPER_ADMIN et SUPPORT) :
  ```typescript
  { href: "/admin/editions/invite", label: "Invité", icon: Icons.Gift }
  ```
- Ajout de l'icône `Gift` dans l'objet `Icons`

### 8.3 `src/modules/editions/components/EditionReader.tsx`
- Extraction d'une prop `apiBase?: string` pour permettre au lecteur public d'utiliser `/api/invite/[token]` au lieu de `/api/editions/[id]`
- Ou : création d'un composant `GuestEditionReader` qui wrappele `EditionReader` avec la configuration publique

---

## 9. Règles de Sécurité

### 9.1 Contrôle d'accès admin
- Les routes `/api/admin/guest-editions/*` vérifient que l'utilisateur connecté a le rôle `SUPER_ADMIN` ou `SUPPORT`
- Utilisation du middleware d'auth existant (`getCurrentUserFromRequest`)

### 9.2 Routes publiques
- Les routes `/api/invite/*` **ne vérifient aucune session**
- La seule protection est le **token opaque** (CUID 25 caractères, entropie suffisante)
- Le token est régénéré à chaque changement d'édition → les anciens liens sont automatiquement invalidés
- Rate limiting recommandé sur les routes image (éviter le scraping complet d'une édition via le token)

### 9.3 Isolation
- Les routes invitées n'exposent que l'édition associée au token
- Aucune route de type `/api/invite/[token]/pages/[page]` ne permettra d'accéder à d'autres éditions

---

## 10. Expérience Utilisateur — Flux Complet

### Côté Administrateur

```
1. Admin ouvre /admin/editions/invite
2. Voit le tableau de 5 jours, tous "Non configurés" au départ
3. Clic "Modifier" sur "Lundi"
4. Modal s'ouvre avec la liste des éditions
5. Admin tape "Cameroon Tribune" dans le filtre
6. Sélectionne "Cameroon Tribune du 16 juin 2026"
7. La modal se ferme
8. La ligne "Lundi" affiche :
   - Date de mise à jour : 17/06/2026 à 10:35
   - Édition : Cameroon Tribune du 16 juin 2026
   - Lien : https://monjournal.cm/lire/invite/clx8k2m...
   [Copier] [Aperçu]
```

### Côté Lecteur Invité

```
1. Lecteur reçoit le lien (email, réseaux sociaux, etc.)
2. Clique sur https://monjournal.cm/lire/invite/clx8k2m...
3. Page charge sans demander de connexion
4. Bandeau : "Vous lisez une édition gratuite — Abonnez-vous pour un accès illimité [S'abonner]"
5. Lecteur en mode feuilletage 3D, toutes les pages accessibles
6. Navigation libre dans l'édition complète
7. Après lecture, CTA vers la page d'abonnement
```

---

## 11. Points de Décision Ouverts

| # | Question | Options | Impact |
|---|----------|---------|--------|
| 1 | Limite du nombre de pages visibles en mode invité ? | Toutes les pages / Seulement les N premières | Conversion vs expérience |
| 2 | Le token doit-il expirer automatiquement (ex: après 7 jours) ? | Expiration auto / Permanent jusqu'au prochain changement | Sécurité vs simplicité admin |
| 3 | Faut-il un analytics de consultation des liens invités ? | Compteur simple (vue + clics) / Aucun suivi | BI et reporting |
| 4 | La page de lecture affiche-t-elle un filigrane sur chaque image ? | Oui (watermark via CSS) / Non | Protection vs qualité perçue |
| 5 | L'URL publique doit-elle inclure le nom du jour pour le SEO ? | `/lire/invite/[token]` vs `/lire/lundi/[token]` | SEO vs opacité |

---

## 12. Critères d'Acceptation

### Page admin `/admin/editions/invite`
- [ ] La page est accessible depuis le menu "Éditions > Invité"
- [ ] Le tableau affiche 7 lignes (lundi à dimanche), dans l'ordre
- [ ] Chaque ligne affiche : jour, date de mise à jour, édition assignée, lien public, actions
- [ ] La modal de sélection liste les éditions disponibles avec filtre textuel
- [ ] La sélection d'une édition met à jour la ligne instantanément
- [ ] Le lien est automatiquement régénéré à chaque nouvelle assignation
- [ ] Le bouton "Copier" copie le lien complet dans le presse-papier
- [ ] Le bouton "Effacer" vide le slot avec confirmation
- [ ] Les slots vides affichent "Non configuré" sans lien actif

### Page de lecture publique `/lire/invite/[token]`
- [ ] La page est accessible sans connexion
- [ ] Un token invalide affiche une page d'erreur claire
- [ ] Un slot vide affiche "Aucune édition disponible"
- [ ] Le lecteur en mode livre fonctionne identiquement au lecteur abonné
- [ ] Le bandeau de conversion vers l'abonnement est visible
- [ ] La navigation clavier (← →) fonctionne
- [ ] La navigation tactile (swipe) fonctionne sur mobile
- [ ] Le zoom fonctionne
- [ ] L'accès ne permet pas de charger d'autres éditions que celle liée au token

---

*Document rédigé après analyse complète du code source existant : schema Prisma, AdminSidebar, EditionReader, routes API demo et authentifiées, système de stockage S3/local.*
