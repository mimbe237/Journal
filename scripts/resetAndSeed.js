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
      slug: "password-reset",
      nom: "Réinitialisation MDP",
      sujet: "Réinitialisation de votre mot de passe",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Réinitialisation de mot de passe</mj-text>
<mj-text color="#4b5563">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.</mj-text>
<mj-button background-color="#2563eb" href="{{reset_link}}">Réinitialiser mon mot de passe</mj-button>
<mj-text color="#6b7280" font-size="12px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</mj-text>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "email-verification",
      nom: "Vérification email",
      sujet: "Vérifiez votre adresse email",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Vérification de votre email</mj-text>
<mj-text color="#4b5563">Merci de vérifier votre adresse email pour activer votre compte.</mj-text>
<mj-button background-color="#2563eb" href="{{verification_link}}">Vérifier mon email</mj-button>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "subscription-confirmation",
      nom: "Confirmation abonnement",
      sujet: "Votre abonnement est actif",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Abonnement confirmé !</mj-text>
<mj-text color="#4b5563">Votre abonnement {{subscription.type}} est maintenant actif jusqu'au {{subscription.dateFin}}.</mj-text>
<mj-button background-color="#2563eb" href="{{app.url}}/dashboard">Accéder au journal</mj-button>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "manual-submission-received",
      nom: "Soumission reçue",
      sujet: "Nous avons reçu votre demande d'abonnement",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Demande reçue</mj-text>
<mj-text color="#4b5563">Nous avons bien reçu votre demande d'abonnement manuel. Notre équipe va vérifier votre paiement et valider votre compte sous 24h.</mj-text>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "manual-submission-approved",
      nom: "Soumission approuvée",
      sujet: "Votre abonnement a été validé",
      corps: `<mj-text font-size="20px" color="#16a34a" font-family="helvetica">Abonnement validé !</mj-text>
<mj-text color="#4b5563">Votre demande d'abonnement a été validée par notre équipe.</mj-text>
<mj-button background-color="#16a34a" href="{{app.url}}/dashboard">Commencer à lire</mj-button>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "manual-submission-rejected",
      nom: "Soumission rejetée",
      sujet: "Problème avec votre demande d'abonnement",
      corps: `<mj-text font-size="20px" color="#dc2626" font-family="helvetica">Demande rejetée</mj-text>
<mj-text color="#4b5563">Votre demande d'abonnement n'a pas pu être validée pour la raison suivante :</mj-text>
<mj-text color="#dc2626" font-weight="bold">{{rejection_reason}}</mj-text>
<mj-text color="#4b5563">Merci de nous contacter ou de soumettre une nouvelle demande.</mj-text>`,
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
    },
    {
      slug: "subscription-expiring-1day",
      nom: "Expiration J-1",
      sujet: "Votre abonnement expire demain",
      corps: `<mj-text font-size="20px" color="#dc2626" font-family="helvetica">Dernier jour !</mj-text>
<mj-text color="#4b5563">Votre abonnement expire demain. Ne perdez pas l'accès à vos journaux.</mj-text>
<mj-button background-color="#dc2626" href="{{app.url}}/subscriptions">Renouveler maintenant</mj-button>`,
      category: "NOTIFICATION"
    },
    {
      slug: "subscription-expired",
      nom: "Abonnement expiré",
      sujet: "Votre abonnement a expiré",
      corps: `<mj-text font-size="20px" color="#dc2626" font-family="helvetica">Abonnement expiré</mj-text>
<mj-text color="#4b5563">Votre abonnement est arrivé à échéance. Renouvelez-le pour continuer à lire nos éditions.</mj-text>
<mj-button background-color="#2563eb" href="{{app.url}}/subscriptions">Renouveler mon abonnement</mj-button>`,
      category: "NOTIFICATION"
    },
    {
      slug: "new-edition-available",
      nom: "Nouvelle édition",
      sujet: "Une nouvelle édition est disponible",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Nouvelle édition !</mj-text>
<mj-text color="#4b5563">L'édition {{edition.title}} est maintenant disponible.</mj-text>
<mj-button background-color="#2563eb" href="{{app.url}}/dashboard">Lire l'édition</mj-button>`,
      category: "MARKETING"
    },
    {
      slug: "enterprise-invitation",
      nom: "Invitation entreprise",
      sujet: "Vous avez été invité à rejoindre un compte entreprise",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Invitation reçue</mj-text>
<mj-text color="#4b5563">{{inviter.name}} vous invite à rejoindre le compte entreprise {{enterprise.name}}.</mj-text>
<mj-button background-color="#2563eb" href="{{invitation_link}}">Accepter l'invitation</mj-button>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "payment-received",
      nom: "Paiement reçu",
      sujet: "Reçu de votre paiement",
      corps: `<mj-text font-size="20px" color="#1f2937" font-family="helvetica">Merci pour votre paiement</mj-text>
<mj-text color="#4b5563">Nous avons bien reçu votre paiement de {{amount}} {{currency}}.</mj-text>
<mj-button background-color="#2563eb" href="{{receipt_link}}">Télécharger le reçu</mj-button>`,
      category: "TRANSACTIONAL"
    },
    {
      slug: "payment-failed",
      nom: "Paiement échoué",
      sujet: "Échec du paiement",
      corps: `<mj-text font-size="20px" color="#dc2626" font-family="helvetica">Paiement refusé</mj-text>
<mj-text color="#4b5563">Votre tentative de paiement a échoué. Veuillez vérifier votre moyen de paiement.</mj-text>
<mj-button background-color="#2563eb" href="{{app.url}}/subscriptions">Réessayer</mj-button>`,
      category: "TRANSACTIONAL"
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
