import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

export async function GET() {
  try {
    // 1. Ajouter la colonne headlines (JSONB)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "editions" ADD COLUMN IF NOT EXISTS "headlines" JSONB;
    `);

    // 2. Ajouter la colonne tags (TEXT[])
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "editions" ADD COLUMN IF NOT EXISTS "tags" TEXT[];
    `);

    // 3. Créer le type ENUM InterestCategory s'il n'existe pas
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "InterestCategory" AS ENUM ('ECONOMIE', 'TECH', 'POLITIQUE', 'SOCIETE', 'EDUCATION', 'SPORT');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch (e) {
      console.log("Enum InterestCategory existe déjà ou erreur ignorée");
    }

    // 4. Ajouter la colonne interests sur users
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[];
    `);

    // 5. Ajouter la colonne region sur users
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "region" TEXT;
    `);

    // ==========================================
    // MODULE PUBLICITÉ (ADVERTISING)
    // ==========================================

    // 6. Créer les Enums Publicité
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
    } catch (e) { console.log("Enums Publicité existent déjà"); }

    // 7. Mettre à jour enterprise_accounts
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[];
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "organizationSize" "OrganizationSize";
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "organizationType" "OrganizationType";
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "sector" TEXT;
      
      -- Colonnes manquantes de la migration subscription_plans
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "licencesAchetees" INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;
      ALTER TABLE "enterprise_accounts" ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);
      ALTER TABLE "enterprise_accounts" ALTER COLUMN "nombreUtilisateursInclus" SET DEFAULT 0;
    `);

    // 7b. Créer les tables manquantes (Plans & Transactions)
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
    } catch (e) { console.log("Enums Plans existent déjà"); }

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

    // 8. Créer les tables Publicité
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
      );
      CREATE INDEX IF NOT EXISTS "advertisers_isActive_idx" ON "advertisers"("isActive");
    `);

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
      );
      CREATE INDEX IF NOT EXISTS "ad_campaigns_status_startDate_endDate_idx" ON "ad_campaigns"("status", "startDate", "endDate");
      CREATE INDEX IF NOT EXISTS "ad_campaigns_advertiserId_idx" ON "ad_campaigns"("advertiserId");
    `);

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

    return NextResponse.json({ 
      success: true, 
      message: "Base de données réparée : Module Publicité complet installé." 
    });
  } catch (error: any) {
    console.error("Erreur migration manuelle:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
