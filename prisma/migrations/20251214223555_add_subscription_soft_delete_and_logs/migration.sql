-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SystemEventType" ADD VALUE 'MODIFICATION_ABONNEMENT';
ALTER TYPE "SystemEventType" ADD VALUE 'SUPPRESSION_ABONNEMENT';
ALTER TYPE "SystemEventType" ADD VALUE 'SUPPRESSION_DEFINITIVE_ABONNEMENT';
ALTER TYPE "SystemEventType" ADD VALUE 'RESTAURATION_ABONNEMENT';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "trashedUntil" TIMESTAMP(3);
