-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('STARTUP', 'PME', 'GRAND_GROUPE', 'ADMINISTRATION', 'ONG', 'EDUCATION', 'SANTE', 'MEDIA', 'PARTICULIER');

-- CreateEnum
CREATE TYPE "OrganizationSize" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "InterestCategory" AS ENUM ('ECONOMIE', 'TECH', 'POLITIQUE', 'SOCIETE', 'EDUCATION', 'SPORT');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdChannel" AS ENUM ('EMAIL_EDITION', 'EMAIL_NEWSLETTER', 'IN_APP_BANNER', 'IN_APP_INTERSTITIAL');

-- AlterTable
ALTER TABLE "enterprise_accounts" ADD COLUMN     "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[],
ADD COLUMN     "organizationSize" "OrganizationSize",
ADD COLUMN     "organizationType" "OrganizationType",
ADD COLUMN     "sector" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[],
ADD COLUMN     "region" TEXT;

-- CreateTable
CREATE TABLE "audience_segments" (
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

-- CreateTable
CREATE TABLE "advertisers" (
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

-- CreateTable
CREATE TABLE "ad_campaigns" (
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

-- CreateTable
CREATE TABLE "ad_campaign_segments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,

    CONSTRAINT "ad_campaign_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_creatives" (
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

-- CreateTable
CREATE TABLE "ad_impressions" (
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

-- CreateTable
CREATE TABLE "ad_clicks" (
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

-- CreateIndex
CREATE UNIQUE INDEX "audience_segments_nom_key" ON "audience_segments"("nom");

-- CreateIndex
CREATE INDEX "audience_segments_isActive_idx" ON "audience_segments"("isActive");

-- CreateIndex
CREATE INDEX "advertisers_isActive_idx" ON "advertisers"("isActive");

-- CreateIndex
CREATE INDEX "ad_campaigns_status_startDate_endDate_idx" ON "ad_campaigns"("status", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "ad_campaigns_advertiserId_idx" ON "ad_campaigns"("advertiserId");

-- CreateIndex
CREATE INDEX "ad_campaign_segments_campaignId_idx" ON "ad_campaign_segments"("campaignId");

-- CreateIndex
CREATE INDEX "ad_campaign_segments_segmentId_idx" ON "ad_campaign_segments"("segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ad_campaign_segments_campaignId_segmentId_key" ON "ad_campaign_segments"("campaignId", "segmentId");

-- CreateIndex
CREATE INDEX "ad_creatives_campaignId_isActive_idx" ON "ad_creatives"("campaignId", "isActive");

-- CreateIndex
CREATE INDEX "ad_impressions_campaignId_viewedAt_idx" ON "ad_impressions"("campaignId", "viewedAt");

-- CreateIndex
CREATE INDEX "ad_impressions_creativeId_viewedAt_idx" ON "ad_impressions"("creativeId", "viewedAt");

-- CreateIndex
CREATE INDEX "ad_impressions_userId_viewedAt_idx" ON "ad_impressions"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "ad_clicks_campaignId_clickedAt_idx" ON "ad_clicks"("campaignId", "clickedAt");

-- CreateIndex
CREATE INDEX "ad_clicks_creativeId_clickedAt_idx" ON "ad_clicks"("creativeId", "clickedAt");

-- CreateIndex
CREATE INDEX "ad_clicks_userId_clickedAt_idx" ON "ad_clicks"("userId", "clickedAt");

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "advertisers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaign_segments" ADD CONSTRAINT "ad_campaign_segments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaign_segments" ADD CONSTRAINT "ad_campaign_segments_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "audience_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_creatives" ADD CONSTRAINT "ad_creatives_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "ad_creatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_impressions" ADD CONSTRAINT "ad_impressions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ad_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "ad_creatives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_clicks" ADD CONSTRAINT "ad_clicks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
