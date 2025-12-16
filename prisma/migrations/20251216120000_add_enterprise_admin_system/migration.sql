-- 1. Enums (Idempotent)
DO $$ BEGIN
    CREATE TYPE "EnterpriseUserRole" AS ENUM ('ADMIN_PRIMAIRE', 'ADMIN_SECONDAIRE', 'MANAGER', 'UTILISATEUR', 'SUSPENDU');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EnterpriseUserStatus" AS ENUM ('INVITE', 'ACTIF', 'SUSPENDU', 'SUPPRIME');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tables (Basic creation if not exists)
CREATE TABLE IF NOT EXISTS "enterprise_accounts" (
    "id" TEXT NOT NULL,
    CONSTRAINT "enterprise_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "enterprise_invitations" (
    "id" TEXT NOT NULL,
    CONSTRAINT "enterprise_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "enterprise_audit_logs" (
    "id" TEXT NOT NULL,
    CONSTRAINT "enterprise_audit_logs_pkey" PRIMARY KEY ("id")
);

-- 3. Columns (Ensure all columns exist - Idempotent)

-- enterprise_accounts
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "nom" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "contactTelephone" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "nombreUtilisateursInclus" INTEGER DEFAULT 0;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "dateCreation" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "adminPrimaireId" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "adminPrimaireEmail" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "nombreUtilisateursActifs" INTEGER DEFAULT 0;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "nombreUtilisateursInvites" INTEGER DEFAULT 0;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "adresseFacturation" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "numeroSiret" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "ssoEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "ssoProvider" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "ssoConfig" JSONB;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "domaineAutorise" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "restrictionIp" BOOLEAN DEFAULT false;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "plagesIpAutorisees" TEXT[];
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "niveauSla" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "contactDedieEmail" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "contactDedieTelephone" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "actif" BOOLEAN DEFAULT true;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- enterprise_invitations
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "enterpriseAccountId" TEXT;
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "role" "EnterpriseUserRole" DEFAULT 'UTILISATEUR';
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "token" TEXT;
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "expireAt" TIMESTAMP(3);
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "acceptedByUserId" TEXT;
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "enterprise_invitations" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- enterprise_audit_logs
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "enterpriseAccountId" TEXT;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "action" TEXT;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "targetUserId" TEXT;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "changedFields" JSONB;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "reason" TEXT;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "performedBy" TEXT;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "performedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "enterprise_audit_logs" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "assignedById" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "dateAssignmentEnterprise" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enterpriseAccountId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enterpriseRole" "EnterpriseUserRole";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enterpriseStatus" "EnterpriseUserStatus";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedReason" TEXT;

-- subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "enterpriseAccountId" TEXT;

-- manual_subscriptions
ALTER TABLE "manual_subscriptions" ADD COLUMN IF NOT EXISTS "entrepriseId" TEXT;

-- 4. Indexes (Idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "enterprise_accounts_adminPrimaireId_key" ON "enterprise_accounts"("adminPrimaireId");
CREATE UNIQUE INDEX IF NOT EXISTS "enterprise_invitations_token_key" ON "enterprise_invitations"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "enterprise_invitations_enterpriseAccountId_email_key" ON "enterprise_invitations"("enterpriseAccountId", "email");
CREATE INDEX IF NOT EXISTS "enterprise_invitations_token_idx" ON "enterprise_invitations"("token");
CREATE INDEX IF NOT EXISTS "enterprise_invitations_enterpriseAccountId_idx" ON "enterprise_invitations"("enterpriseAccountId");
CREATE INDEX IF NOT EXISTS "enterprise_audit_logs_enterpriseAccountId_idx" ON "enterprise_audit_logs"("enterpriseAccountId");
CREATE INDEX IF NOT EXISTS "enterprise_audit_logs_performedBy_idx" ON "enterprise_audit_logs"("performedBy");
CREATE INDEX IF NOT EXISTS "enterprise_audit_logs_targetUserId_idx" ON "enterprise_audit_logs"("targetUserId");
CREATE INDEX IF NOT EXISTS "subscriptions_enterpriseAccountId_statut_dateFin_idx" ON "subscriptions"("enterpriseAccountId", "statut", "dateFin");
CREATE INDEX IF NOT EXISTS "manual_subscriptions_entrepriseId_idx" ON "manual_subscriptions"("entrepriseId");

-- 5. Foreign Keys (Drop & Recreate to be Idempotent)
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_enterpriseAccountId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "enterprise_accounts" DROP CONSTRAINT IF EXISTS "enterprise_accounts_adminPrimaireId_fkey";
ALTER TABLE "enterprise_accounts" ADD CONSTRAINT "enterprise_accounts_adminPrimaireId_fkey" FOREIGN KEY ("adminPrimaireId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "enterprise_invitations" DROP CONSTRAINT IF EXISTS "enterprise_invitations_enterpriseAccountId_fkey";
ALTER TABLE "enterprise_invitations" ADD CONSTRAINT "enterprise_invitations_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enterprise_audit_logs" DROP CONSTRAINT IF EXISTS "enterprise_audit_logs_enterpriseAccountId_fkey";
ALTER TABLE "enterprise_audit_logs" ADD CONSTRAINT "enterprise_audit_logs_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enterprise_audit_logs" DROP CONSTRAINT IF EXISTS "enterprise_audit_logs_performedBy_fkey";
ALTER TABLE "enterprise_audit_logs" ADD CONSTRAINT "enterprise_audit_logs_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enterprise_audit_logs" DROP CONSTRAINT IF EXISTS "enterprise_audit_logs_targetUserId_fkey";
ALTER TABLE "enterprise_audit_logs" ADD CONSTRAINT "enterprise_audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_enterpriseAccountId_fkey";
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_enterpriseAccountId_fkey" FOREIGN KEY ("enterpriseAccountId") REFERENCES "enterprise_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manual_subscriptions" DROP CONSTRAINT IF EXISTS "manual_subscriptions_entrepriseId_fkey";
ALTER TABLE "manual_subscriptions" ADD CONSTRAINT "manual_subscriptions_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "enterprise_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Record Migration (Safe Insert with execution_time)
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "execution_time")
VALUES (gen_random_uuid(), 'manual', NOW(), '20251216120000_add_enterprise_admin_system', NULL, NULL, NOW(), 0);
