# Prompts d'Implémentation — Éditions Invitées

> Ces prompts sont à exécuter **dans l'ordre**, chaque étape dépendant de la précédente.  
> Projet : Next.js 16 App Router · Prisma 5 · PostgreSQL · Tailwind CSS v4 · TypeScript  
> Répertoire racine : `c:\app\temp-ct\Journal-main`

---

## PROMPT 1 — Migration Prisma : Modèle GuestEdition

```
Tu travailles sur un projet Next.js 16 avec Prisma 5 et PostgreSQL.
Le fichier de schéma est : prisma/schema.prisma

CONTEXTE DU PROJET :
- Les modèles utilisent des noms PascalCase côté Prisma et des tables snake_case via @@map
- Les IDs sont des CUIDs (@id @default(cuid()))
- Les soft-deletes utilisent deletedAt DateTime? et trashedUntil DateTime?
- Tous les modèles existants ont @@map("snake_case_table_name")
- Le modèle Edition (ligne 438 du schéma) contient les champs id, titre, datePublication, nombrePages, cheminInternePdf, deletedAt

TÂCHE :
Ajoute le modèle GuestEdition dans prisma/schema.prisma, APRÈS le modèle Edition existant.

SPÉCIFICATION EXACTE DU MODÈLE :
```prisma
model GuestEdition {
  id          String    @id @default(cuid())
  dayOfWeek   Int       @unique // 1=Lundi, 2=Mardi, 3=Mercredi, 4=Jeudi, 5=Vendredi, 6=Samedi, 7=Dimanche
  dayLabel    String    // "Lundi", "Mardi", etc.
  editionId   String?
  publicToken String    @unique @default(cuid())
  assignedAt  DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  edition     Edition?  @relation(fields: [editionId], references: [id], onDelete: SetNull)

  @@index([dayOfWeek])
  @@index([publicToken])
  @@map("guest_editions")
}
```

Sur le modèle Edition existant, ajoute la relation inverse EXACTEMENT comme ceci (dans la liste des relations existantes, après readingProgress ReadingProgress[]) :
  guestEditions GuestEdition[]

ENSUITE, crée le fichier de seed : prisma/seeds/seedGuestEditions.ts
Ce fichier doit :
1. Utiliser le client Prisma existant depuis @prisma/client
2. Créer exactement 7 enregistrements avec upsert (sur dayOfWeek) pour être idempotent
3. Les données à insérer :
   - dayOfWeek: 1, dayLabel: "Lundi"
   - dayOfWeek: 2, dayLabel: "Mardi"
   - dayOfWeek: 3, dayLabel: "Mercredi"
   - dayOfWeek: 4, dayLabel: "Jeudi"
   - dayOfWeek: 5, dayLabel: "Vendredi"
   - dayOfWeek: 6, dayLabel: "Samedi"
   - dayOfWeek: 7, dayLabel: "Dimanche"
4. Pour chaque upsert : where: { dayOfWeek }, create: { tous les champs }, update: { dayLabel } seulement (ne jamais écraser editionId ou publicToken s'ils existent déjà)
5. Logger chaque opération avec console.log

ENSUITE, ajoute le script dans package.json sous "scripts" :
  "seed:guest-editions": "npx ts-node prisma/seeds/seedGuestEditions.ts"

CONTRAINTES :
- Ne modifie aucun autre modèle existant sauf l'ajout de la relation sur Edition
- Ne crée pas de migration SQL manuellement — Prisma la génère via `prisma migrate dev`
- N'exécute pas prisma migrate, contente-toi des modifications de fichiers

VÉRIFIE :
- Le schema est syntaxiquement valide (pas de virgule manquante, relations correctes des deux côtés)
- Le seed est idempotent (peut être lancé plusieurs fois sans créer de doublons)
```

---

## PROMPT 2 — Service Métier : guestEditionService.ts

```
Tu travailles sur un projet Next.js 16 avec Prisma 5.
Le client Prisma est importé depuis : @/lib/config/prisma (export nommé { prisma, prismaRuntimeReady })

CONTEXTE DU PROJET :
- Les services existants suivent le pattern : fonctions async pures qui utilisent prisma directement
- Exemple de référence à lire et imiter : src/modules/editions/editionService.ts
- Les erreurs sont propagées vers les routes API, pas swallowées dans les services
- Les types Prisma sont importés depuis @prisma/client

TÂCHE :
Crée le fichier src/modules/guest-editions/guestEditionService.ts

Ce service doit exporter les fonctions suivantes :

1. getAllGuestEditions()
   - Retourne les 7 slots triés par dayOfWeek ASC
   - Include l'édition associée : { id, titre, datePublication, type, nombrePages, cheminImageUne }
   - Ne filtre PAS sur deletedAt de Edition (l'admin doit voir si une édition assignée a été supprimée)
   - Type de retour : GuestEdition avec edition nullable

2. getGuestEditionByToken(token: string)
   - Cherche un GuestEdition WHERE publicToken = token AND isActive = true
   - Include l'édition associée complète (mêmes champs + cheminInternePdf)
   - Vérifie que edition.deletedAt IS NULL (ne pas servir une édition supprimée)
   - Retourne null si non trouvé, slot vide (editionId null), ou édition supprimée
   - NE PAS logger l'erreur ici, laisser la route API gérer le 404

3. updateGuestEditionSlot(id: string, editionId: string | null)
   - Si editionId est non-null : vérifie que l'édition existe (prisma.edition.findUnique) et que deletedAt IS NULL. Lance une Error("Edition introuvable") si invalide.
   - Génère un nouveau publicToken = utilise la librairie native crypto.randomUUID() (disponible dans Node.js 18+, pas besoin d'import)
   - Met à jour : editionId, publicToken (nouveau), assignedAt = new Date()
   - Si editionId est null : met editionId à null, publicToken à nouveau token, assignedAt à null
   - Retourne l'enregistrement mis à jour avec l'édition incluse

4. getGuestEditionById(id: string)
   - Simple findUnique par id
   - Retourne null si non trouvé

CONTRAINTES :
- Pas de try/catch dans le service — laisser les erreurs remonter
- Pas de logique de réponse HTTP dans le service
- Utilise await prismaRuntimeReady; au début de chaque fonction (pattern de l'app)
- Respecte le pattern des autres services du projet (pas de classe, juste des fonctions exportées)
- N'importe que ce dont tu as besoin depuis @prisma/client

VÉRIFIE :
- Tous les types TypeScript sont corrects (pas de any implicite)
- La génération du token utilise crypto.randomUUID() et non cuid() (pour ne pas dépendre d'une lib externe)
- La fonction updateGuestEditionSlot invalide toujours l'ancien lien en régénérant le token
```

---

## PROMPT 3 — Routes API Admin : /api/admin/guest-editions

```
Tu travailles sur un projet Next.js 16 App Router avec TypeScript.
Les routes API utilisent NextRequest/NextResponse depuis "next/server".
L'authentification se fait via : getCurrentUserFromRequest(req) depuis @/lib/auth/currentUser
  → retourne null si non authentifié, sinon { id, role, ... }
Les rôles sont définis dans l'enum UserRole de @prisma/client.

CONTEXTE DU PROJET :
- Exemple de route admin à imiter : src/app/api/admin/editions/route.ts
- Pattern de réponse d'erreur : NextResponse.json({ error: "message" }, { status: 4xx })
- Pattern de réponse succès : NextResponse.json({ data })
- Les routes admin vérifient toujours que l'utilisateur a un rôle autorisé
- Le service à utiliser est dans : src/modules/guest-editions/guestEditionService.ts (créé au prompt 2)

TÂCHE :
Crée les deux fichiers de routes suivants :

─── Fichier 1 : src/app/api/admin/guest-editions/route.ts ───

Méthode GET :
1. Authentifier avec getCurrentUserFromRequest(req)
2. Vérifier que le rôle est dans [SUPER_ADMIN, SUPPORT] — sinon 403
3. Appeler getAllGuestEditions() du service
4. Pour chaque slot, construire l'URL publique :
   const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
   const publicUrl = slot.editionId ? `${baseUrl}/lire/invite/${slot.publicToken}` : null
5. Retourner 200 avec le tableau enrichi de publicUrl

─── Fichier 2 : src/app/api/admin/guest-editions/[id]/route.ts ───

Méthode PATCH :
1. Authentifier et vérifier le rôle [SUPER_ADMIN, SUPPORT] — sinon 403
2. Parser le body JSON : { editionId: string | null }
3. Valider : si editionId est présent, ce doit être une string non vide
4. Appeler getGuestEditionById(id) pour vérifier que le slot existe — sinon 404
5. Appeler updateGuestEditionSlot(id, editionId)
6. Si l'appel lève une Error("Edition introuvable") : retourner 404 { error: "Édition introuvable ou supprimée" }
7. Construire et retourner 200 avec le slot mis à jour + publicUrl

CONTRAINTES :
- Entoure chaque handler d'un try/catch global qui retourne 500 avec le message d'erreur
- Exporte export const dynamic = "force-dynamic" en haut de chaque fichier de route
- Ne pas logger les erreurs attendues (404), logger uniquement les erreurs inattendues avec console.error
- Ne jamais exposer les stacktraces dans les réponses JSON

VÉRIFIE :
- Les deux routes refusent les requêtes non authentifiées avec 401
- Les deux routes refusent les rôles non autorisés avec 403
- La route PATCH retourne bien le slot complet (avec edition et publicUrl) après mise à jour
- La route GET retourne publicUrl = null pour les slots sans editionId
```

---

## PROMPT 4 — Routes API Publiques : /api/invite/[token]

```
Tu travailles sur un projet Next.js 16 App Router avec TypeScript.
Ces routes sont PUBLIQUES : elles ne vérifient aucune session utilisateur.
Le système de stockage de fichiers est abstraits via : src/services/fileStorage.ts
  → utilise fileStorageProvider.fileExists({ path }) et fileStorageProvider.getFileStream({ path })

CONTEXTE DU PROJET :
- Exemple de route publique à imiter : src/app/api/demo/edition/[id]/pages/[page]/image/route.ts
  (lire ce fichier — il montre exactement comment servir une image depuis le stockage)
- Les images sont stockées au chemin : editions/[editionId]/images/page-[N].webp (ou .png)
- Le service à utiliser est dans : src/modules/guest-editions/guestEditionService.ts
- Importe { prismaRuntimeReady } depuis @/lib/config/prisma pour s'assurer que Prisma est prêt

TÂCHE :
Crée les deux fichiers de routes publiques suivants :

─── Fichier 1 : src/app/api/invite/[token]/route.ts ───

Méthode GET :
1. export const dynamic = "force-dynamic"
2. Récupérer params.token
3. await prismaRuntimeReady
4. Appeler getGuestEditionByToken(token) du service
5. Si null → 404 { error: "Lien invalide ou aucune édition configurée pour ce créneau" }
6. Retourner 200 :
{
  edition: {
    id, titre, datePublication, type, nombrePages
  },
  guestInfo: {
    dayLabel: slot.dayLabel,
    isGuestAccess: true
  }
}
7. Cache-Control: "no-store" (les métadonnées peuvent changer quand l'admin reconfigure)

─── Fichier 2 : src/app/api/invite/[token]/pages/[page]/image/route.ts ───

Méthode GET :
1. export const dynamic = "force-dynamic"
2. Récupérer params.token et params.page
3. await prismaRuntimeReady
4. Résoudre le token → getGuestEditionByToken(token)
5. Si null → 403 { error: "Accès refusé" } (ne pas donner d'info sur l'existence du token)
6. Valider pageNumber : parseInt(page, 10), vérifier 1 ≤ page ≤ edition.nombrePages
7. Construire le chemin image : "editions/" + edition.id + "/images/page-" + pageNumber
8. Tenter webp d'abord, puis png (même logique que le fichier de démo)
9. Si aucun format trouvé → 404 { error: "Image indisponible" }
10. Retourner l'image avec :
    Cache-Control: "public, max-age=3600"
    Content-Type: "image/webp" ou "image/png"

CONTRAINTES :
- Aucune vérification de session ou JWT dans ces routes
- En cas d'erreur inattendue : console.error + 500 { error: "Erreur serveur" }
- Le chemin de l'image doit être identique au pattern utilisé dans la route demo (lire le fichier demo pour confirmer)
- Ne jamais retourner le chemin interne des fichiers dans les réponses JSON

VÉRIFIE :
- Un token invalide retourne 403 sur la route image (pas 404) pour ne pas confirmer l'inexistence
- Un slot valide mais sans édition retourne 404 sur la route métadonnées
- Les images sont servies avec Cache-Control public pour le CDN
- La logique webp → png est identique à celle de la route demo existante
```

---

## PROMPT 5 — Page Admin : /admin/editions/invite

```
Tu travailles sur un projet Next.js 16 App Router avec TypeScript et Tailwind CSS v4.
C'est une page CLIENT ("use client") dans le back-office admin.

CONTEXTE DU PROJET — fichiers à lire avant de commencer :
1. src/app/admin/editions/bulk-import/page.tsx → référence de style et structure pour une page admin complexe
2. src/app/admin/editions/list/page.tsx → référence pour affichage d'éditions en tableau
3. src/components/ui/Button.tsx → composants bouton existants (ButtonPrimary, ButtonSecondary)
4. src/components/ui/Card.tsx → composant Card existant
Les couleurs primaires du projet sont emerald-600 (vert) et slate-xxx (gris).

TÂCHE :
Crée le fichier src/app/admin/editions/invite/page.tsx

FONCTIONNEMENT DE LA PAGE :

Au mount, fetch GET /api/admin/guest-editions pour charger les 7 slots.

Structure de l'état local :
- slots: GuestSlot[] (tableau des 7 jours)
- loading: boolean
- editingSlot: GuestSlot | null (slot en cours de modification, null = modal fermée)
- editions: EditionOption[] (liste des éditions, chargée à l'ouverture de la modal)
- editionsLoading: boolean
- searchQuery: string (filtre de la modal)
- saving: boolean (pendant le PATCH)
- copiedId: string | null (ID du slot dont on vient de copier le lien, pour feedback)

Types locaux à définir :
```typescript
interface GuestSlot {
  id: string
  dayOfWeek: number
  dayLabel: string
  editionId: string | null
  edition: { titre: string; datePublication: string; type: string; cheminImageUne: string | null } | null
  publicToken: string
  publicUrl: string | null
  assignedAt: string | null
  isActive: boolean
}
interface EditionOption {
  id: string
  titre: string
  datePublication: string
  type: string
  cheminImageUne: string | null
}
```

COMPOSANTS ET LAYOUT :

En-tête de page :
- Titre h1 "Éditions invitées" en text-2xl font-bold text-slate-900
- Sous-titre : "Configurez une édition gratuite pour chaque jour de la semaine. Les liens générés sont accessibles sans connexion."
- Badge à droite : "7 créneaux" en emerald

Tableau principal :
- Tableau HTML standard avec les colonnes : Jour | Mise à jour | Édition assignée | Lien public | Actions
- Une ligne par slot, toujours 7 lignes, triées par dayOfWeek
- Style de tableau identique à celui de bulk-import/page.tsx (header bg-gray-50, lignes divide-y)

Contenu de chaque ligne :
- Colonne "Jour" : badge coloré avec le nom du jour (lundi=bleu, mardi=violet, mercredi=vert, jeudi=orange, vendredi=rouge, samedi=rose, dimanche=indigo)
- Colonne "Mise à jour" : date formatée "DD/MM/YYYY à HH:mm" (utilise date-fns déjà dans les dépendances : import { format } from "date-fns"; import { fr } from "date-fns/locale"). Si assignedAt est null → texte "—" en slate-400
- Colonne "Édition assignée" : titre de l'édition + date de publication en dessous en text-xs text-slate-400. Si vide → badge "Non configuré" en amber-100 text-amber-700
- Colonne "Lien public" : si publicUrl non null → input readonly contenant l'URL + bouton icône de copie. Si null → texte "—" grisé
- Colonne "Actions" : bouton "Modifier" (emerald) + bouton "Effacer" (rouge, désactivé si slot déjà vide)

Comportement du bouton "Copier" :
- Appelle navigator.clipboard.writeText(publicUrl)
- Pendant 2 secondes : affiche une icône ✓ verte à la place de l'icône copie
- Utilise copiedId pour savoir quel slot affiche le feedback

Comportement du bouton "Effacer" :
- window.confirm("Effacer l'édition du [dayLabel] ?")
- Si confirmé : PATCH /api/admin/guest-editions/[id] avec { editionId: null }
- Recharge les slots après succès

MODAL DE SÉLECTION D'ÉDITION :

S'ouvre quand editingSlot est non-null.
Overlay sombre avec div centrée (fixed inset-0 bg-black/50 flex items-center justify-center z-50).
Largeur : max-w-2xl w-full mx-4.

Contenu de la modal :
- En-tête : "Sélectionner une édition — [editingSlot.dayLabel]" + bouton ✕ de fermeture
- Champ de recherche (filtre sur titre de l'édition)
- Liste scrollable (max-h-96 overflow-y-auto) des éditions filtrées
- Chaque item : titre à gauche, date de publication à droite en text-xs text-slate-400
  - L'item de l'édition actuellement assignée à ce slot est mis en évidence (ring emerald)
  - Clic sur l'item → sélectionne directement (pas de bouton "Valider" séparé)
- Loading spinner pendant le chargement des éditions
- Texte "Aucune édition trouvée" si la liste filtrée est vide

Chargement des éditions pour la modal :
- Au premier clic "Modifier", fetch GET /api/admin/editions?limit=200
- Mettre le résultat en cache dans le state (ne pas recharger à chaque ouverture)

Sélection d'une édition :
- PATCH /api/admin/guest-editions/[editingSlot.id] avec { editionId: selectedEditionId }
- Pendant le PATCH : saving = true, désactiver les interactions
- Après succès : fermer la modal, recharger les slots
- En cas d'erreur : alert("Erreur lors de la sauvegarde : " + errorMessage)

CONTRAINTES :
- Utilise uniquement Tailwind CSS, pas de styles inline sauf pour des cas impossibles en Tailwind
- Pas de librairie externe pour la modal — implémentation vanilla React
- Utilise les composants Button existants du projet là où c'est adapté
- Gestion d'erreur : si le fetch initial échoue, afficher un message d'erreur centré avec bouton "Réessayer"
- La page doit fonctionner sans JavaScript désactivé (dégradation gracieuse non requise)

VÉRIFIE :
- Les 7 lignes s'affichent toujours même si l'API retourne un tableau vide (défaut gracieux)
- Le bouton "Effacer" est disabled quand le slot est déjà vide
- Le feedback "Copié !" revient à l'état normal après 2 secondes (clearTimeout propre dans un useEffect)
- La modal se ferme avec la touche Escape (useEffect sur keydown)
- La liste des éditions dans la modal est filtrée en local (pas de requête API par frappe)
```

---

## PROMPT 6 — Mise à jour de la Sidebar Admin

```
Tu travailles sur un projet Next.js 16 App Router avec TypeScript.

CONTEXTE :
Lis attentivement le fichier src/components/admin/AdminSidebar.tsx dans son intégralité.
Ce fichier définit :
- Un objet Icons avec des SVG inline
- Des navSections pour chaque rôle (FACTURATION, COMMERCIAL, SUPPORT, SUPER_ADMIN/default)
- La section "Éditions" du SUPER_ADMIN (default) contient actuellement 3 items :
  { href: "/admin/editions", label: "Nouvelle édition", icon: Icons.NewEdition },
  { href: "/admin/editions/list", label: "Gérer les éditions", icon: Icons.ListEditions },
  { href: "/admin/editions/bulk-import", label: "Import en masse", icon: Icons.BulkImport },

TÂCHE — deux modifications dans AdminSidebar.tsx :

MODIFICATION 1 : Ajouter l'icône "Gift" dans l'objet Icons
Ajoute cette entrée dans l'objet Icons, après l'entrée BulkImport :
```
Gift: (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
),
```

MODIFICATION 2 : Ajouter l'item "Invité" dans la section Éditions
Dans la section "Éditions" du bloc SUPER_ADMIN/default (else), ajoute l'item APRÈS "Import en masse" :
```
{ href: "/admin/editions/invite", label: "Invité", icon: Icons.Gift },
```

Ajoute également cet item dans la section "Contenu" du rôle SUPPORT (qui contient déjà "Nouvelle édition" et "Gérer les éditions"), APRÈS "Gérer les éditions" :
```
{ href: "/admin/editions/invite", label: "Invité", icon: Icons.Gift },
```

CONTRAINTES :
- Ne modifie RIEN d'autre dans ce fichier
- Conserve l'ordre exact des items existants
- Ne reformate pas le fichier, ne réorganise pas les imports
- Vérifie que Icons.Gift est bien défini AVANT son utilisation dans navSections

VÉRIFIE :
- Le fichier compile sans erreur TypeScript
- L'item "Invité" apparaît après "Import en masse" dans la section SUPER_ADMIN
- L'item "Invité" apparaît dans la section SUPPORT > Contenu
- L'icône Gift est correctement placée dans l'objet Icons
```

---

## PROMPT 7 — Page de Lecture Publique : /lire/invite/[token]

```
Tu travailles sur un projet Next.js 16 App Router avec TypeScript et Tailwind CSS v4.
Cette page est PUBLIQUE — aucune authentification requise.

CONTEXTE DU PROJET — fichiers à lire avant de commencer :
1. src/modules/editions/components/EditionReader.tsx — le lecteur existant complet (1500 lignes)
   Comprends bien son interface : il reçoit editionId: string et appelle /api/editions/[editionId]
   Il appelle aussi /api/editions/${editionId}/pages/${page}/image pour les images
2. src/app/api/demo/edition/route.ts — exemple de page utilisant une route publique similaire

OBJECTIF :
Créer une page de lecture publique qui réutilise la logique visuelle d'EditionReader
mais qui appelle les routes publiques /api/invite/[token] et /api/invite/[token]/pages/[page]/image

STRATÉGIE TECHNIQUE (importante) :
Ne modifie PAS EditionReader.tsx existant.
À la place, crée un nouveau composant GuestEditionReader qui est une copie adaptée d'EditionReader
avec les modifications suivantes :
- La prop est { token: string } au lieu de { editionId: string }
- La fonction getImageUrl retourne /api/invite/${token}/pages/${page}/image
- Le fetch initial appelle /api/invite/${token} (pas /api/editions/${editionId})
- Le useEffect de tracking (POST /api/editions/${editionId}/track) est SUPPRIMÉ entièrement
- Le useEffect de ReadingProgress côté serveur est SUPPRIMÉ (garder uniquement le localStorage)
- La gestion d'erreur 401/403 retourne "Lien de lecture invalide ou expiré." au lieu du message d'abonnement

Place ce composant dans : src/modules/guest-editions/components/GuestEditionReader.tsx

TÂCHE PRINCIPALE :
Crée le fichier src/app/lire/invite/[token]/page.tsx

Ce fichier est un SERVER COMPONENT (pas de "use client") :
```typescript
import { GuestEditionReader } from "@/modules/guest-editions/components/GuestEditionReader"

export default async function GuestReaderPage({
  params
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Bandeau de conversion */}
      <div className="bg-emerald-700 text-white px-4 py-2 flex items-center justify-between text-sm">
        <span>
          📖 Vous lisez une édition gratuite
        </span>
        <a
          href="/abonnement"
          className="bg-white text-emerald-700 font-semibold px-3 py-1 rounded-full text-xs hover:bg-emerald-50 transition"
        >
          S'abonner →
        </a>
      </div>

      {/* Lecteur */}
      <div className="flex-1">
        <GuestEditionReader token={token} />
      </div>
    </div>
  )
}
```

Pour GuestEditionReader.tsx, les SEULES différences par rapport à EditionReader.tsx sont :
1. Interface des props : { token: string } (pas editionId)
2. getImageUrl → /api/invite/${token}/pages/${page}/image
3. fetchEdition → fetch(/api/invite/${token}) et parser { edition, guestInfo }
4. Supprimer le useEffect du tracking serveur (lignes qui font POST /api/editions/${editionId}/track)
5. Le message d'erreur 403 devient : "Ce lien de lecture est invalide ou a expiré."
6. Dans handleSharePage, l'URL de partage devient window.location.href (pas /editions/${editionId})

MÉTADONNÉES SEO pour la page (optionnel mais recommandé) :
```typescript
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invite/${token}`, { cache: "no-store" })
    if (!res.ok) return { title: "Lecture invitée" }
    const data = await res.json()
    return {
      title: data.edition.titre,
      description: `Lisez gratuitement : ${data.edition.titre}`,
      robots: "noindex" // Ne pas indexer les liens temporaires
    }
  } catch {
    return { title: "Lecture invitée" }
  }
}
```

CONTRAINTES :
- La page et le composant ne doivent pas importer getCurrentUser ou tout ce qui touche à l'auth
- Pas de redirect vers /auth/login en cas d'erreur — afficher une page d'erreur inline
- Le composant GuestEditionReader doit être marqué "use client"
- Le layout de /lire/invite/[token] ne doit PAS utiliser le layout admin (AdminSidebar)
- Ne pas créer de fichier layout.tsx dans /lire/ — la page utilise le layout racine

VÉRIFIE :
- La page est accessible sans cookie de session (tester avec un onglet incognito)
- Le bandeau vert de conversion s'affiche au-dessus du lecteur
- Le lecteur fonctionne en mode flip, simple et double
- En cas de token invalide, une page d'erreur s'affiche (pas de crash ou redirect)
- Le robots: noindex empêche l'indexation des liens invités
```

---

## PROMPT 8 — Tests d'Intégration et Vérification Finale

```
Tu travailles sur un projet Next.js 16. Tu viens d'implémenter le module "Éditions Invitées".
Les fichiers créés/modifiés sont :
- prisma/schema.prisma (modèle GuestEdition ajouté)
- prisma/seeds/seedGuestEditions.ts (seed des 7 slots)
- src/modules/guest-editions/guestEditionService.ts (service métier)
- src/modules/guest-editions/components/GuestEditionReader.tsx (lecteur public)
- src/app/api/admin/guest-editions/route.ts (GET admin)
- src/app/api/admin/guest-editions/[id]/route.ts (PATCH admin)
- src/app/api/invite/[token]/route.ts (GET public métadonnées)
- src/app/api/invite/[token]/pages/[page]/image/route.ts (GET public image)
- src/app/admin/editions/invite/page.tsx (page admin)
- src/app/lire/invite/[token]/page.tsx (page lecture publique)
- src/components/admin/AdminSidebar.tsx (item Invité ajouté)

TÂCHE : Effectue une vérification complète en lisant chaque fichier créé et en vérifiant les points suivants.

CHECKLIST DE VÉRIFICATION :

1. COHÉRENCE DES CHEMINS D'API
   - La route image publique /api/invite/[token]/pages/[page]/image construit-elle le chemin fichier identique à /api/editions/[id]/pages/[page]/image ?
   - Les deux routes doivent chercher : "editions/" + editionId + "/images/page-" + page + ".webp"
   - Si différent, corriger la route publique

2. COHÉRENCE DU SERVICE
   - Dans guestEditionService.ts, getGuestEditionByToken retourne-t-il null si edition.deletedAt n'est pas null ?
   - Dans updateGuestEditionSlot, un nouveau token est-il TOUJOURS généré (même quand on efface le slot) ?

3. SÉCURITÉ
   - Les routes /api/admin/guest-editions/* vérifient-elles bien le rôle avant toute opération ?
   - Les routes /api/invite/* ne contiennent-elles aucun import de getCurrentUserFromRequest ?
   - La route image publique retourne-t-elle 403 (pas 404) pour un token invalide ?

4. SIDEBAR
   - AdminSidebar.tsx : l'item "Invité" est-il présent dans le bloc SUPER_ADMIN (else) section "Éditions" ?
   - AdminSidebar.tsx : l'item "Invité" est-il présent dans le bloc SUPPORT section "Contenu" ?
   - L'icône Icons.Gift est-elle définie avant d'être utilisée ?

5. TYPES TYPESCRIPT
   - Aucun `any` implicite dans les fichiers créés ?
   - Les interfaces locales de la page admin correspondent-elles à la réponse de l'API ?

6. IDEMPOTENCE DU SEED
   - Le seed utilise-t-il upsert (pas create) pour les 7 enregistrements ?
   - La clause update du upsert modifie-t-elle uniquement dayLabel et pas publicToken/editionId ?

Si tu identifies un problème lors de la vérification, corrige-le directement dans le fichier concerné.
Produis à la fin un rapport listant : les problèmes trouvés, les corrections apportées, et les points conformes.
```

---

## Ordre d'exécution recommandé

| Étape | Prompt | Dépendances |
|-------|--------|-------------|
| 1 | Schema Prisma + Seed | Aucune |
| 2 | Service guestEditionService | Prompt 1 (schema) |
| 3 | Routes API Admin | Prompt 2 (service) |
| 4 | Routes API Publiques | Prompt 2 (service) |
| 5 | Page Admin | Prompts 3 (route admin) |
| 6 | Sidebar | Aucune (indépendant) |
| 7 | Page lecture publique | Prompt 4 (routes publiques) |
| 8 | Vérification finale | Tous les prompts |

**Avant de lancer les prompts 3 à 8 :** exécuter `npx prisma migrate dev --name add_guest_editions` puis `npm run seed:guest-editions` pour que la base soit à jour.
