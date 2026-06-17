-- CreateEnum
CREATE TYPE "LicenseTransactionType" AS ENUM ('ACHAT', 'AJUSTEMENT_ADMIN', 'REMBOURSEMENT', 'MIGRATION_INITIALE');

-- CreateEnum
CREATE TYPE "PlanTargetAudience" AS ENUM ('INDIVIDUAL', 'ENTERPRISE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SystemEventType" ADD VALUE 'ACHAT_LICENCE_ENTREPRISE';
ALTER TYPE "SystemEventType" ADD VALUE 'AJUSTEMENT_LICENCE_ENTREPRISE';

-- AlterTable
ALTER TABLE "editions" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "trashedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "enterprise_accounts" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "licencesAchetees" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trashedUntil" TIMESTAMP(3),
ALTER COLUMN "nombreUtilisateursInclus" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "journal_types" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "trashedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "enterprise_license_transactions" (
    "id" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
    "type" "LicenseTransactionType" NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "paymentRef" TEXT,
    "prixUnitaire" DECIMAL(10,2),
    "montantTotal" DECIMAL(10,2),
    "devise" VARCHAR(3) DEFAULT 'XAF',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "enterprise_license_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "targetAudience" "PlanTargetAudience" NOT NULL DEFAULT 'INDIVIDUAL',
    "durationMonths" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'XAF',
    "pricePerUser" DECIMAL(10,2),
    "minUsers" INTEGER,
    "maxUsers" INTEGER,
    "advantages" JSONB NOT NULL DEFAULT '[]',
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_journal_types" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "journalTypeId" TEXT NOT NULL,

    CONSTRAINT "subscription_plan_journal_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enterprise_license_transactions_enterpriseAccountId_created_idx" ON "enterprise_license_transactions"("enterpriseAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "enterprise_license_transactions_createdBy_idx" ON "enterprise_license_transactions"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_nom_key" ON "subscription_plans"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_slug_key" ON "subscription_plans"("slug");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_isPublic_targetAudience_display_idx" ON "subscription_plans"("isActive", "isPublic", "targetAudience", "displayOrder");

-- CreateIndex
CREATE INDEX "subscription_plan_journal_types_planId_idx" ON "subscription_plan_journal_types"("planId");

-- CreateIndex
CREATE INDEX "subscription_plan_journal_types_journalTypeId_idx" ON "subscription_plan_journal_types"("journalTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_journal_types_planId_journalTypeId_key" ON "subscription_plan_journal_types"("planId", "journalTypeId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- AddForeignKey
ALTER TABLE "enterprise_license_transactions" ADD CONSTRAINT "enterprise_license_transactions_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_license_transactions" ADD CONSTRAINT "enterprise_license_transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_journal_types" ADD CONSTRAINT "subscription_plan_journal_types_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_journal_types" ADD CONSTRAINT "subscription_plan_journal_types_journalTypeId_fkey" FOREIGN KEY ("journalTypeId") REFERENCES "journal_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
