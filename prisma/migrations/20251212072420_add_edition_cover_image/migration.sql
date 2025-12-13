-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ABONNE', 'ADMIN', 'COMPTE_ENTREPRISE', 'UTILISATEUR_ENTREPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('MENSUEL', 'ANNUEL', 'OFFERT', 'PROMOTIONNEL', 'TEST');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIF', 'EXPIRE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('ONLINE', 'OFFLINE', 'CODE_PROMO', 'PARTENARIAT', 'AUTRE');

-- CreateEnum
CREATE TYPE "EditionType" AS ENUM ('QUOTIDIEN', 'HEBDOMADAIRE', 'HORS_SERIE', 'SPECIAL');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('POURCENTAGE', 'MONTANT_FIXE');

-- CreateEnum
CREATE TYPE "SystemEventType" AS ENUM ('CONNEXION', 'LECTURE_EDITION', 'TENTATIVE_TELECHARGEMENT', 'CHANGEMENT_IP', 'REMBOURSEMENT', 'RENOUVELLEMENT_ABONNEMENT', 'CREATION_ABONNEMENT', 'ANNULATION_ABONNEMENT', 'AJUSTEMENT_ABONNEMENT', 'CREATION_COMPTE_ENTREPRISE', 'MODIFICATION_COMPTE_ENTREPRISE', 'AJOUT_UTILISATEUR_ENTREPRISE', 'SUPPRESSION_UTILISATEUR_ENTREPRISE', 'CREATION_CODE_PROMO', 'MODIFICATION_CODE_PROMO', 'UTILISATION_CODE_PROMO', 'CREATION_EDITION', 'CONVERSION_EDITION', 'RAPPEL_EXPIRATION_ABONNEMENT', 'EXECUTION_RAPPELS_EXPIRATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCES', 'ECHEC', 'EN_ATTENTE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dernierLoginAt" TIMESTAMP(3),
    "enterpriseAccountId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_accounts" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactTelephone" TEXT,
    "nombreUtilisateursInclus" INTEGER NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "type" "SubscriptionType" NOT NULL,
    "statut" "SubscriptionStatus" NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "devise" VARCHAR(3) NOT NULL,
    "source" "SubscriptionSource" NOT NULL,
    "userId" TEXT,
    "enterpriseAccountId" TEXT,
    "promoCodeId" TEXT,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editions" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "datePublication" TIMESTAMP(3) NOT NULL,
    "type" "EditionType" NOT NULL,
    "cheminInternePdf" TEXT NOT NULL,
    "cheminImageUne" TEXT,
    "nombrePages" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "typeRemise" "DiscountType" NOT NULL,
    "valeurRemise" DECIMAL(10,2) NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "nombreUtilisationsMax" INTEGER,
    "nombreUtilisationsActuel" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "pageDebut" INTEGER NOT NULL,
    "pageFin" INTEGER NOT NULL,
    "dateHeureDebut" TIMESTAMP(3) NOT NULL,
    "dateHeureFin" TIMESTAMP(3) NOT NULL,
    "adresseIp" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,

    CONSTRAINT "reading_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_events" (
    "id" TEXT NOT NULL,
    "typeEvenement" "SystemEventType" NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "subscriptionId" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "devise" VARCHAR(3) NOT NULL,
    "statut" "PaymentStatus" NOT NULL,
    "referenceExterne" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "subscriptions_userId_statut_dateFin_idx" ON "subscriptions"("userId", "statut", "dateFin");

-- CreateIndex
CREATE INDEX "subscriptions_enterpriseAccountId_statut_dateFin_idx" ON "subscriptions"("enterpriseAccountId", "statut", "dateFin");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_actif_dateFin_idx" ON "promo_codes"("actif", "dateFin");

-- CreateIndex
CREATE INDEX "reading_sessions_userId_editionId_dateHeureDebut_idx" ON "reading_sessions"("userId", "editionId", "dateHeureDebut");

-- CreateIndex
CREATE INDEX "system_events_typeEvenement_createdAt_idx" ON "system_events"("typeEvenement", "createdAt");

-- CreateIndex
CREATE INDEX "system_events_userId_createdAt_idx" ON "system_events"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_referenceExterne_key" ON "payment_transactions"("referenceExterne");

-- CreateIndex
CREATE INDEX "payment_transactions_subscriptionId_statut_createdAt_idx" ON "payment_transactions"("subscriptionId", "statut", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "promo_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_events" ADD CONSTRAINT "system_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
