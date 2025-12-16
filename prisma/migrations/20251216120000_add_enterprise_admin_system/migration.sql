-- CreateEnum
CREATE TYPE "EnterpriseUserRole" AS ENUM ('ADMIN_PRIMAIRE', 'ADMIN_SECONDAIRE', 'MANAGER', 'UTILISATEUR', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "EnterpriseUserStatus" AS ENUM ('ACTIF', 'INVITE', 'SUSPENDU', 'SUPPRIME');

-- AlterTable: Add admin fields to EnterpriseAccount
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "adminPrimaireId" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "adminPrimaireEmail" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "nombreUtilisateursActifs" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "nombreUtilisateursInvites" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- AlterTable: Add enterprise role fields to User
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enterpriseRole" "EnterpriseUserRole";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isAdminEnterprise" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dateAssignmentEnterprise" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enterpriseStatus" "EnterpriseUserStatus" DEFAULT 'ACTIF';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assignedById" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);

-- CreateTable: EnterpriseAuditLog
CREATE TABLE IF NOT EXISTS "enterprise_audit_logs" (
    "id" TEXT NOT NULL,
    "enterpriseAccountId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "changedFields" JSONB,
    "reason" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "enterprise_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "enterprise_audit_logs_enterpriseAccountId_idx" ON "enterprise_audit_logs"("enterpriseAccountId");
CREATE INDEX IF NOT EXISTS "enterprise_audit_logs_performedBy_idx" ON "enterprise_audit_logs"("performedBy");
CREATE INDEX IF NOT EXISTS "enterprise_audit_logs_targetUserId_idx" ON "enterprise_audit_logs"("targetUserId");
CREATE INDEX IF NOT EXISTS "users_enterpriseRole_idx" ON "users"("enterpriseRole");
CREATE INDEX IF NOT EXISTS "users_enterpriseStatus_idx" ON "users"("enterpriseStatus");

-- AddForeignKey
ALTER TABLE "enterprise_audit_logs" ADD CONSTRAINT "enterprise_audit_logs_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
