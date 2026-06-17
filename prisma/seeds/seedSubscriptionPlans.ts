// Script pour créer les plans d'abonnement par défaut
// Usage: npx ts-node prisma/seeds/seedSubscriptionPlans.ts

import { PrismaClient, PlanTargetAudience } from "@prisma/client";

const prisma = new PrismaClient();

const defaultPlans = [
  // Plans Individuels
  {
    nom: "Mensuel",
    slug: "mensuel",
    description: "Accès complet pendant 1 mois",
    targetAudience: PlanTargetAudience.INDIVIDUAL,
    durationMonths: 1,
    basePrice: 2500,
    currency: "XAF",
    advantages: [
      "Toutes les éditions",
      "Lecture illimitée",
      "Annulation possible"
    ],
    highlight: false,
    badge: null,
    displayOrder: 1,
    isActive: true,
    isPublic: true
  },
  {
    nom: "Annuel",
    slug: "annuel",
    description: "Accès complet pendant 1 an (meilleur prix)",
    targetAudience: PlanTargetAudience.INDIVIDUAL,
    durationMonths: 12,
    basePrice: 25000,
    currency: "XAF",
    advantages: [
      "Toutes les éditions",
      "Lecture illimitée",
      "Support prioritaire",
      "Économies de 17%"
    ],
    highlight: true,
    badge: "Meilleur prix",
    displayOrder: 2,
    isActive: true,
    isPublic: true
  },
  {
    nom: "Essai gratuit",
    slug: "essai-gratuit",
    description: "7 jours d'accès complet",
    targetAudience: PlanTargetAudience.INDIVIDUAL,
    durationMonths: 1, // Durée minimale pour le modèle, mais on utilisera durationDays dans la logique
    basePrice: 0,
    currency: "XAF",
    advantages: [
      "Accès complet 7 jours",
      "Sans engagement"
    ],
    highlight: false,
    badge: null,
    displayOrder: 3,
    isActive: true,
    isPublic: true
  },
  // Plans Entreprise
  {
    nom: "Entreprise Mensuel",
    slug: "entreprise-mensuel",
    description: "Accès complet pour l'équipe pendant 1 mois",
    targetAudience: PlanTargetAudience.ENTERPRISE,
    durationMonths: 1,
    basePrice: 8500,
    currency: "XAF",
    pricePerUser: 1500,
    minUsers: 3,
    maxUsers: 10,
    advantages: [
      "Multi-utilisateurs (jusqu'à 10)",
      "Lecture illimitée",
      "Support prioritaire",
      "Gestion centralisée"
    ],
    highlight: false,
    badge: null,
    displayOrder: 1,
    isActive: true,
    isPublic: true
  },
  {
    nom: "Entreprise Annuel",
    slug: "entreprise-annuel",
    description: "Tarif préférentiel annuel pour les équipes",
    targetAudience: PlanTargetAudience.ENTERPRISE,
    durationMonths: 12,
    basePrice: 85000,
    currency: "XAF",
    pricePerUser: 12000,
    minUsers: 3,
    maxUsers: 50,
    advantages: [
      "Multi-utilisateurs (jusqu'à 50)",
      "Support dédié",
      "Économies de 15%",
      "Facturation groupée",
      "Accès aux archives complètes"
    ],
    highlight: true,
    badge: "Populaire",
    displayOrder: 2,
    isActive: true,
    isPublic: true
  }
];

async function main() {
  console.log("🌱 Création des plans d'abonnement par défaut...\n");

  for (const plan of defaultPlans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug: plan.slug }
    });

    if (existing) {
      console.log(`⏭️  Plan "${plan.nom}" existe déjà (slug: ${plan.slug})`);
      continue;
    }

    await prisma.subscriptionPlan.create({
      data: plan
    });

    console.log(`✅ Plan créé: ${plan.nom} (${plan.targetAudience}) - ${plan.basePrice} ${plan.currency}`);
  }

  console.log("\n✨ Seed terminé!");

  // Afficher le résumé
  const counts = await prisma.subscriptionPlan.groupBy({
    by: ["targetAudience"],
    _count: { id: true }
  });

  console.log("\n📊 Résumé des plans:");
  for (const c of counts) {
    console.log(`   - ${c.targetAudience}: ${c._count.id} plan(s)`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
