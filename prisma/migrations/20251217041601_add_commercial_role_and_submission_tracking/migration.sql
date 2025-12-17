/*
  Warnings:

  - The `role` column on the `enterprise_invitations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `title_template` on the `journal_types` table. All the data in the column will be lost.
  - Made the column `nombreUtilisateursActifs` on table `enterprise_accounts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nombreUtilisateursInvites` on table `enterprise_accounts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `enterpriseAccountId` on table `enterprise_audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `action` on table `enterprise_audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `performedBy` on table `enterprise_audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `performedAt` on table `enterprise_audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdBy` on table `enterprise_invitations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SystemEventType" ADD VALUE 'SUSPENSION_UTILISATEUR_ENTREPRISE';
ALTER TYPE "SystemEventType" ADD VALUE 'CHANGEMENT_ROLE_ENTREPRISE';
ALTER TYPE "SystemEventType" ADD VALUE 'INVITATION_ENTREPRISE_ENVOYEE';
ALTER TYPE "SystemEventType" ADD VALUE 'INVITATION_ENTREPRISE_ACCEPTEE';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'COMMERCIAL';

-- AlterTable
ALTER TABLE "enterprise_accounts" ALTER COLUMN "nombreUtilisateursActifs" SET NOT NULL,
ALTER COLUMN "nombreUtilisateursInvites" SET NOT NULL;

-- AlterTable
ALTER TABLE "enterprise_audit_logs" ALTER COLUMN "enterpriseAccountId" SET NOT NULL,
ALTER COLUMN "action" SET NOT NULL,
ALTER COLUMN "performedBy" SET NOT NULL,
ALTER COLUMN "performedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "enterprise_invitations" DROP COLUMN "role",
ADD COLUMN     "role" "EnterpriseUserRole" NOT NULL DEFAULT 'UTILISATEUR',
ALTER COLUMN "createdBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "journal_types" DROP COLUMN "title_template",
ADD COLUMN     "titleTemplate" VARCHAR(255);

-- AlterTable
ALTER TABLE "manual_subscriptions" ADD COLUMN     "soumisParId" TEXT;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "totalPages" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEditions" BOOLEAN NOT NULL DEFAULT true,
    "expirationAlerts" BOOLEAN NOT NULL DEFAULT true,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "summaryFrequency" TEXT NOT NULL DEFAULT 'weekly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "reading_progress_userId_lastReadAt_idx" ON "reading_progress"("userId", "lastReadAt");

-- CreateIndex
CREATE UNIQUE INDEX "reading_progress_userId_editionId_key" ON "reading_progress"("userId", "editionId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "manual_subscriptions" ADD CONSTRAINT "manual_subscriptions_soumisParId_fkey" FOREIGN KEY ("soumisParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_subscriptions" ADD CONSTRAINT "manual_subscriptions_validePar_fkey" FOREIGN KEY ("validePar") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
