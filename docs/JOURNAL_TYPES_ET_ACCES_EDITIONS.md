# Journal types et acces aux editions

## Objectif
Expliquer comment les types de journal structurent les editions et comment les droits d'acces sont determines pour la lecture.

## Type de journal (JournalType)
- Champs clefs :
	- `name` : nom du journal/publication.
	- `frequency` : QUOTIDIEN | HEBDOMADAIRE | MENSUEL | HORS_SERIE | SPECIAL.
	- Tarifs : `unitPrice`, `monthlyPrice`, `sixMonthPrice`, `yearlyPrice` (en XAF).
	- `isActive` : active/inactive (affichage dans les formulaires d'edition seulement si actif).
- Regles :
	- Un type inactif n'apparait pas pour creer une edition.
	- Suppression possible seulement s'il n'y a pas d'editions liees.

## Flux administratif
1) Creer le type (nom, frequence, tarifs, actif).
2) Associer le type lors de la creation d'une edition (liste filtree sur les types actifs).
3) Eventuellement desactiver un type pour qu'il ne soit plus propose, sans toucher aux editions deja publiees.

## Acces aux editions (cote lecteur)
L'acces est derive du statut d'abonnement et expose au front via `access.status` :
- `read` : l'utilisateur peut lire l'edition (couverture active).
- `buy_or_subscribe` : l'utilisateur doit acheter ou souscrire pour acceder.
- `subscribe` : l'utilisateur doit souscrire (pas d'achat a l'unite disponible).

Couverture d'abonnement (individuel ou entreprise) :
- `coverage.type` : `individual` ou `enterprise`.
- `coverage.dateDebut` / `coverage.dateFin` : fenetre de validite.
- La lecture est autorisee si la date courante est dans la fenetre de validite; sinon on montre l'appel a l'abonnement.

## Bonnes pratiques
- Garder au moins un type actif pour permettre la creation d'editions.
- Renseigner tous les tarifs si l'offre les utilise (unit, monthly, sixMonth, yearly) pour eviter des cas bord.
- Ne pas renommer un type utilise en production sans communiquer, pour ne pas perturber les exports/rapports.

## Checklist rapide
- [ ] Type cree et actif.
- [ ] Tarifs saisis.
- [ ] Edition creee liee au type.
- [ ] Abonnement actif verifie (individual/enterprise) pour tester l'acces `read`.
