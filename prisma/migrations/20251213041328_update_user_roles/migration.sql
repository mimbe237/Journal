/*
  Warnings:

  - The values [ADMIN] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JustificatifType" AS ENUM ('RECU_CAISSE', 'BULLETIN_ABONNEMENT', 'FACTURE', 'AUTRE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SystemEventType" ADD VALUE 'VALIDATION_SOUMISSION_ABONNEMENT';
ALTER TYPE "SystemEventType" ADD VALUE 'REJET_SOUMISSION_ABONNEMENT';

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ABONNE', 'UTILISATEUR_ENTREPRISE', 'COMPTE_ENTREPRISE', 'FACTURATION', 'SUPPORT', 'SUPER_ADMIN');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE
    WHEN "role"::text = 'ADMIN' THEN 'SUPER_ADMIN'::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END
);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "enterprise_accounts" ADD COLUMN     "actif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "adresseFacturation" TEXT,
ADD COLUMN     "contactDedieEmail" TEXT,
ADD COLUMN     "contactDedieTelephone" TEXT,
ADD COLUMN     "domaineAutorise" TEXT,
ADD COLUMN     "niveauSla" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "numeroSiret" TEXT,
ADD COLUMN     "plagesIpAutorisees" TEXT[],
ADD COLUMN     "restrictionIp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssoConfig" JSONB,
ADD COLUMN     "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ssoProvider" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "submissionId" TEXT;

-- CreateTable
CREATE TABLE "enterprise_invitations" (
    "id" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'UTILISATEUR_ENTREPRISE',
    "token" TEXT NOT NULL,
    "expireAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "entrepriseId" TEXT,
    "type" "SubscriptionType" NOT NULL,
    "periode" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "devise" VARCHAR(3) NOT NULL DEFAULT 'XOF',
    "statut" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "motifRejet" TEXT,
    "soumisA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validePar" TEXT,
    "valideA" TIMESTAMP(3),

    CONSTRAINT "manual_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "justificatifs" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "type" "JustificatifType" NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "tailleMo" DOUBLE PRECISION NOT NULL,
    "uploadA" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "justificatifs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_invitations_token_key" ON "enterprise_invitations"("token");

-- CreateIndex
CREATE INDEX "enterprise_invitations_token_idx" ON "enterprise_invitations"("token");

-- CreateIndex
CREATE INDEX "enterprise_invitations_enterpriseAccountId_idx" ON "enterprise_invitations"("enterpriseAccountId");

-- CreateIndex
CREATE INDEX "manual_subscriptions_email_statut_idx" ON "manual_subscriptions"("email", "statut");

-- CreateIndex
CREATE INDEX "manual_subscriptions_statut_soumisA_idx" ON "manual_subscriptions"("statut", "soumisA");

-- CreateIndex
CREATE INDEX "manual_subscriptions_entrepriseId_idx" ON "manual_subscriptions"("entrepriseId");

-- CreateIndex
CREATE INDEX "justificatifs_submissionId_idx" ON "justificatifs"("submissionId");

-- CreateIndex
CREATE INDEX "subscriptions_submissionId_idx" ON "subscriptions"("submissionId");

-- AddForeignKey
ALTER TABLE "enterprise_invitations" ADD CONSTRAINT "enterprise_invitations_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "manual_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_subscriptions" ADD CONSTRAINT "manual_subscriptions_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "enterprise_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justificatifs" ADD CONSTRAINT "justificatifs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "manual_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
