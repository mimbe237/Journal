-- AlterTable
ALTER TABLE "manual_subscriptions" ADD COLUMN     "pays" TEXT,
ADD COLUMN     "telephone" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "pays" TEXT,
ADD COLUMN     "telephone" TEXT;
