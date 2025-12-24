import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stepParam = searchParams.get("step");
  const step = stepParam ? parseInt(stepParam) : null;

  try {
    const logs: string[] = [];

    // 1. Ajouter la colonne headlines (JSONB)
    if (!step || step === 1) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "editions" ADD COLUMN IF NOT EXISTS "headlines" JSONB;
      `);
      logs.push("1. Colonne headlines ajoutée");
    }

    // 2. Ajouter la colonne tags (TEXT[])
    if (!step || step === 2) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "editions" ADD COLUMN IF NOT EXISTS "tags" TEXT[];
      `);
      logs.push("2. Colonne tags ajoutée");
    }

    // 3. Créer le type ENUM InterestCategory s'il n'existe pas
    if (!step || step === 3) {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "InterestCategory" AS ENUM ('ECONOMIE', 'TECH', 'POLITIQUE', 'SOCIETE', 'EDUCATION', 'SPORT');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        logs.push("3. Enum InterestCategory vérifié");
      } catch (e) {
        logs.push("3. Enum InterestCategory erreur (ignorée)");
      }
    }

    // 4. Ajouter la colonne interests sur users
    if (!step || step === 4) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[];
      `);
      logs.push("4. Colonne interests ajoutée sur users");
    }

    // 5. Ajouter la colonne region sur users
    if (!step || step === 5) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "region" TEXT;
      `);
      logs.push("5. Colonne region ajoutée sur users");
    }

    // ==========================================
    // MODULE PUBLICITÉ (ADVERTISING)
    // ==========================================

    // 6. Créer les Enums Publicité
    if (!step || step === 6) {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "OrganizationType" AS ENUM ('STARTUP', 'PME', 'GRAND_GROUPE', 'ADMINISTRATION', 'ONG', 'EDUCATION', 'SANTE', 'MEDIA', 'PARTICULIER');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "OrganizationSize" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "AdChannel" AS ENUM ('EMAIL_EDITION', 'EMAIL_NEWSLETTER', 'IN_APP_BANNER', 'IN_APP_INTERSTITIAL');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        logs.push("6. Enums Publicité créés");
      } catch (e) { 
        logs.push("6. Enums Publicité erreur (ignorée)");
      }
    }

    // 7. Mettre à jour enterprise_accounts
    if (!step || step === 7) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "enterprise_accounts" (
          "id" TEXT NOT NULL,
          "nom" TEXT NOT NULL,
          "contactEmail" TEXT NOT NULL,
          "contactTelephone" TEXT,
          "nombreUtilisateursInclus" INTEGER NOT NULL DEFAULT 0,
          "licencesAchetees" INTEGER NOT NULL DEFAULT 0,
          "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "adminPrimaireId" TEXT,
          "adminPrimaireEmail" TEXT,
          "nombreUtilisateursActifs" INTEGER NOT NULL DEFAULT 0,
          "nombreUtilisateursInvites" INTEGER NOT NULL DEFAULT 0,
          "organizationType" "OrganizationType",
          "organizationSize" "OrganizationSize",
          "sector" TEXT,
          "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[],
          "adresseFacturation" TEXT,
          "numeroSiret" TEXT,
          "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
          "ssoProvider" TEXT,
          "ssoConfig" JSONB,
          "domaineAutorise" TEXT,
          "restrictionIp" BOOLEAN NOT NULL DEFAULT false,
          "plagesIpAutorisees" TEXT[],
          "niveauSla" TEXT,
          "contactDedieEmail" TEXT,
          "contactDedieTelephone" TEXT,
          "actif" BOOLEAN NOT NULL DEFAULT true,
          "notes" TEXT,
          "createdBy" TEXT,
          "deletedAt" TIMESTAMP(3),
          "trashedUntil" TIMESTAMP(3),
          "deletedBy" TEXT,
          CONSTRAINT "enterprise_accounts_pkey" PRIMARY KEY ("id")
        )
      `);
      
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "enterprise_accounts_adminPrimaireId_key" ON "enterprise_accounts"("adminPrimaireId")
      `);

      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[]`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "organizationSize" "OrganizationSize"`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "organizationType" "OrganizationType"`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "sector" TEXT`);
      
      // Colonnes manquantes de la migration subscription_plans
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "licencesAchetees" INTEGER NOT NULL DEFAULT 0`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3)`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "enterprise_accounts" ALTER COLUMN "nombreUtilisateursInclus" SET DEFAULT 0`);
      
      logs.push("7. Table enterprise_accounts mise à jour");
    }

    // 7b. Créer les tables manquantes (Plans & Transactions)
    if (!step || step === 8) {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "LicenseTransactionType" AS ENUM ('ACHAT', 'AJUSTEMENT_ADMIN', 'REMBOURSEMENT', 'MIGRATION_INITIALE');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
        
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            CREATE TYPE "PlanTargetAudience" AS ENUM ('INDIVIDUAL', 'ENTERPRISE');
          EXCEPTION WHEN duplicate_object THEN null; END $$;
        `);
      } catch (e) { logs.push("8. Enums Plans erreur (ignorée)"); }

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "enterprise_license_transactions" (
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
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "subscription_plans" (
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
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "subscription_plan_journal_types" (
          "id" TEXT NOT NULL,
          "planId" TEXT NOT NULL,
          "journalTypeId" TEXT NOT NULL,
          CONSTRAINT "subscription_plan_journal_types_pkey" PRIMARY KEY ("id")
        );
      `);
      logs.push("8. Tables Plans & Transactions créées");
    }

    // 8. Créer les tables Publicité
    if (!step || step === 9) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "audience_segments" (
          "id" TEXT NOT NULL,
          "nom" TEXT NOT NULL,
          "description" TEXT,
          "filters" JSONB NOT NULL DEFAULT '{}',
          "estimatedReach" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "lastRefreshedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "audience_segments_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "advertisers" (
          "id" TEXT NOT NULL,
          "nom" TEXT NOT NULL,
          "contactEmail" TEXT NOT NULL,
          "contactPhone" TEXT,
          "entreprise" TEXT,
          "logoUrl" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "advertisers_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "advertisers_isActive_idx" ON "advertisers"("isActive")`);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ad_campaigns" (
          "id" TEXT NOT NULL,
          "nom" TEXT NOT NULL,
          "advertiserId" TEXT NOT NULL,
          "status" "AdCampaignStatus" NOT NULL DEFAULT 'DRAFT',
          "startDate" TIMESTAMP(3) NOT NULL,
          "endDate" TIMESTAMP(3) NOT NULL,
          "budget" DECIMAL(10,2),
          "currency" VARCHAR(3) NOT NULL DEFAULT 'XAF',
          "priority" INTEGER NOT NULL DEFAULT 0,
          "channels" "AdChannel"[] DEFAULT ARRAY[]::"AdChannel"[],
          "isExclusive" BOOLEAN NOT NULL DEFAULT false,
          "dailyCap" INTEGER,
          "totalCap" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ad_campaigns_status_startDate_endDate_idx" ON "ad_campaigns"("status", "startDate", "endDate")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ad_campaigns_advertiserId_idx" ON "ad_campaigns"("advertiserId")`);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ad_campaign_segments" (
          "id" TEXT NOT NULL,
          "campaignId" TEXT NOT NULL,
          "segmentId" TEXT NOT NULL,
          CONSTRAINT "ad_campaign_segments_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ad_creatives" (
          "id" TEXT NOT NULL,
          "campaignId" TEXT NOT NULL,
          "nom" TEXT NOT NULL,
          "imageUrl" TEXT NOT NULL,
          "clickUrl" TEXT NOT NULL,
          "altText" TEXT,
          "mjmlSnippet" TEXT,
          "htmlSnippet" TEXT,
          "width" INTEGER,
          "height" INTEGER,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ad_creatives_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ad_impressions" (
          "id" TEXT NOT NULL,
          "campaignId" TEXT NOT NULL,
          "creativeId" TEXT NOT NULL,
          "userId" TEXT,
          "channel" "AdChannel" NOT NULL,
          "emailSendId" TEXT,
          "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "metadata" JSONB,
          CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ad_clicks" (
          "id" TEXT NOT NULL,
          "campaignId" TEXT NOT NULL,
          "creativeId" TEXT NOT NULL,
          "userId" TEXT,
          "channel" "AdChannel" NOT NULL,
          "emailSendId" TEXT,
          "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "metadata" JSONB,
          CONSTRAINT "ad_clicks_pkey" PRIMARY KEY ("id")
        );
      `);
      logs.push("9. Tables Publicité créées");
    }

    // 10. Ajouter la colonne planId sur subscriptions
    if (!step || step === 10) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "planId" TEXT;
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "subscriptions_planId_idx" ON "subscriptions"("planId")`);
      logs.push("10. Colonne planId ajoutée sur subscriptions");
    }

    // 9. Créer la table ReadingSession
    if (!step || step === 11) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "reading_sessions" (
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
        )
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reading_sessions_userId_editionId_dateHeureDebut_idx" ON "reading_sessions"("userId", "editionId", "dateHeureDebut")`);
      logs.push("11. Table reading_sessions créée");
    }

    // 11. Créer la table ReadingProgress
    if (!step || step === 12) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ReadingProgress" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "editionId" TEXT NOT NULL,
          "pageNumber" INTEGER NOT NULL,
          "totalPages" INTEGER NOT NULL,
          "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ReadingProgress_userId_editionId_key" ON "ReadingProgress"("userId", "editionId")`);
      logs.push("12. Table ReadingProgress créée");
    }

    // 12. Mettre à jour l'enum SubscriptionType
    if (!step || step === 13) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'TRIMESTRIEL'`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'AUTRE'`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'OFFERT'`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'PROMOTIONNEL'`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "SubscriptionType" ADD VALUE IF NOT EXISTS 'TEST'`);
        logs.push("13. Enum SubscriptionType mis à jour");
      } catch (e) {
        logs.push("13. Erreur update enum SubscriptionType (ignorée)");
      }
    }

    // 13. Supprimer les colonnes de prix obsolètes de journal_types
    if (!step || step === 14) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "journal_types" DROP COLUMN IF EXISTS "monthlyPrice"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "journal_types" DROP COLUMN IF EXISTS "sixMonthPrice"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "journal_types" DROP COLUMN IF EXISTS "yearlyPrice"`);
        logs.push("14. Colonnes prix obsolètes supprimées de journal_types");
      } catch (e) {
        logs.push("14. Erreur suppression colonnes prix journal_types (ignorée)");
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Migration terminée",
      logs
    });
  } catch (error: any) {
    console.error("Erreur migration manuelle:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
