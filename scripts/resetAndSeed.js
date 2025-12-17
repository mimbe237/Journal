const { PrismaClient, UserRole, SubscriptionType, SubscriptionStatus, JournalFrequency, EditionType } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Nettoyage de la base de données...");
  
  // On garde l'admin principal s'il existe
  const adminEmail = "admin@journal.com";
  
  // Suppression dans l'ordre pour respecter les contraintes de clé étrangère
  await prisma.readingProgress.deleteMany({});
  await prisma.readingSession.deleteMany({});
  await prisma.documentJustificatif.deleteMany({});
  await prisma.manualSubscriptionSubmission.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.enterpriseInvitation.deleteMany({});
  await prisma.enterpriseAuditLog.deleteMany({});
  await prisma.enterpriseAccount.deleteMany({});
  await prisma.emailSend.deleteMany({});
  await prisma.emailAutomation.deleteMany({});
  await prisma.emailTemplate.deleteMany({});
  await prisma.emailLayout.deleteMany({});
  // On ne supprime pas les éditions car demandé par l'utilisateur ("sauf ajouter une nouvelle edition" interprété comme "ne pas toucher aux éditions existantes" ou "ne pas en créer de fausses")
  // Mais l'utilisateur a dit "supprime toutes les donnees sauf l'administrateur". 
  // Clarification: "creer des contenus par defaut... (sauf ajouter une nouvelle edition)" -> Je ne crée pas d'édition, mais je supprime les anciennes ?
  // "netoi la bd, et supprime toutes les donnees sauf l'administrateur" -> Je supprime tout.
  await prisma.edition.deleteMany({}); 
  await prisma.journalType.deleteMany({});
  await prisma.promoCode.deleteMany({});
  
  // Suppression des utilisateurs sauf l'admin
  await prisma.user.deleteMany({
    where: {
      email: {
        not: adminEmail
      }
    }
  });

  console.log("✅ Base de données nettoyée (Admin conservé).");
}

async function seedDatabase() {
  console.log("🌱 Démarrage du seeding...");

  // 1. Création des utilisateurs par défaut
  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);
  
  const users = [
    { email: "abonne@test.com", nom: "Jean Abonné", role: UserRole.ABONNE },
    { email: "commercial@test.com", nom: "Pierre Commercial", role: UserRole.COMMERCIAL },
    { email: "support@test.com", nom: "Sophie Support", role: UserRole.SUPPORT },
    { email: "facturation@test.com", nom: "Marc Facturation", role: UserRole.FACTURATION },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        nom: u.nom,
        motDePasseHash: passwordHash,
        role: u.role
      }
    });
  }

  // 2. Création des types de journaux
  console.log("Creating journal types...");
  const journalTypes = [
    {
      name: "Cameroon Tribune",
      frequency: JournalFrequency.QUOTIDIEN,
      unitPrice: 400,
      monthlyPrice: 10000,
      sixMonthPrice: 55000,
      yearlyPrice: 100000,
      titleTemplate: "Cameroon Tribune N°{{numero}} du {{date_long}}"
    },
    {
      name: "Weekend Sports",
      frequency: JournalFrequency.HEBDOMADAIRE,
      unitPrice: 500,
      monthlyPrice: 2000,
      sixMonthPrice: 11000,
      yearlyPrice: 20000,
      titleTemplate: "Weekend Sports - {{date}}"
    },
    {
      name: "Finance Hebdo",
      frequency: JournalFrequency.HEBDOMADAIRE,
      unitPrice: 1000,
      monthlyPrice: 4000,
      sixMonthPrice: 22000,
      yearlyPrice: 40000,
      titleTemplate: "Finance Hebdo - Semaine du {{date}}"
    }
  ];

  for (const jt of journalTypes) {
    await prisma.journalType.create({ data: jt });
  }

  // 3. Création Entreprise et Utilisateurs liés
  console.log("Creating enterprise...");
  const enterpriseUser = await prisma.user.create({
    data: {
      email: "admin@tech-corp.com",
      nom: "Admin TechCorp",
      motDePasseHash: passwordHash,
      role: UserRole.COMPTE_ENTREPRISE
    }
  });

  const enterprise = await prisma.enterpriseAccount.create({
    data: {
      nom: "Tech Corp SA",
      contactEmail: "contact@tech-corp.com",
      contactTelephone: "+237 600000000",
      adresseFacturation: "Douala, Akwa",
      numeroSiret: "M0123456789",
      nombreUtilisateursInclus: 5,
      adminPrimaire: {
        connect: { id: enterpriseUser.id }
      }
    }
  });

  // Employé de l'entreprise
  await prisma.user.create({
    data: {
      email: "employe@tech-corp.com",
      nom: "Employé TechCorp",
      motDePasseHash: passwordHash,
      role: UserRole.UTILISATEUR_ENTREPRISE,
      enterpriseAccountId: enterprise.id
    }
  });

  // 4. Création Layouts Email
  console.log("Creating email layouts...");
  const layout = await prisma.emailLayout.create({
    data: {
      nom: "Layout Standard",
      mjml: `<mjml>
  <mj-body background-color="#f3f4f6">
    <mj-section background-color="#ffffff" padding-bottom="0px" padding-top="0">
      <mj-column width="100%">
        <mj-image src="https://journal-app-beta-nine.vercel.app/logo.png" alt="Logo" align="center" width="150px" padding="20px"></mj-image>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding-bottom="20px" padding-top="20px">
      <mj-column width="100%">
        {{content}}
      </mj-column>
    </mj-section>
    <mj-section background-color="#f3f4f6" padding-top="20px">
      <mj-column width="100%">
        <mj-text align="center" color="#9ca3af" font-size="12px">
          © 2025 Digital Journal Platform. Tous droits réservés.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
    }
  });

  // 5. Création Templates Email
  console.log("Creating email templates...");
  const templates = [
    {
      slug: "welcome",
      nom: "Bienvenue",
      sujet: "Bienvenue sur notre plateforme !",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Bienvenue {{user.nom}} !</mj-text>
<mj-text color="#4b5563" font-family="helvetica">Nous sommes ravis de vous compter parmi nous.</mj-text>
<mj-button background-color="#2563eb" href="{{app.url}}">Accéder à mon compte</mj-button>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "subscription-expiring-7days",
      nom: "Expiration J-7",
      sujet: "Votre abonnement expire dans 7 jours",
      corps: `<mj-text font-size="20px" color="#dc2626" font-family="helvetica">Attention !</mj-text>
<mj-text color="#4b5563">Votre abonnement {{subscription.type}} expire le {{subscription.dateFin}}.</mj-text>
<mj-button background-color="#dc2626" href="{{app.url}}/subscriptions">Renouveler maintenant</mj-button>`,
      category: "NOTIFICATION"
    }
  ];

  for (const t of templates) {
    await prisma.emailTemplate.create({
      data: {
        ...t,
        locale: "fr",
        status: "PUBLISHED",
        layoutId: layout.id
      }
    });
  }

  // 6. Création Codes Promo
  console.log("Creating promo codes...");
  await prisma.promoCode.create({
    data: {
      code: "BIENVENUE2025",
      typeRemise: "POURCENTAGE",
      valeurRemise: 20,
      dateDebut: new Date(),
      dateFin: new Date("2025-12-31"),
      nombreUtilisationsMax: 100
    }
  });

  // 7. Création d'une soumission manuelle en attente (pour tester le menu validation)
  console.log("Creating manual submission...");
  await prisma.manualSubscriptionSubmission.create({
    data: {
      email: "nouveau.client@gmail.com",
      nom: "Nouveau Client",
      telephone: "699999999",
      type: SubscriptionType.ANNUEL,
      periode: "12 mois",
      montant: 100000,
      statut: "PENDING"
    }
  });

  console.log("✅ Seeding terminé avec succès !");
}

async function main() {
  await cleanDatabase();
  await seedDatabase();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await cleanDatabase();
    await seedDatabase();
    await prisma.$disconnect();
  });
