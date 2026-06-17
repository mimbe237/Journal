-- CreateEnum
CREATE TYPE "JournalFrequency" AS ENUM ('QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL', 'HORS_SERIE', 'SPECIAL');

-- AlterEnum
ALTER TYPE "EditionType" ADD VALUE 'MENSUEL';

-- AlterTable
ALTER TABLE "editions" ADD COLUMN     "devise" VARCHAR(3),
ADD COLUMN     "journalTypeId" TEXT,
ADD COLUMN     "prix" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "trashedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "journal_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "JournalFrequency" NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "sixMonthPrice" DECIMAL(10,2) NOT NULL,
    "yearlyPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" VARCHAR(3) NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rateToXaf" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "journal_types_name_key" ON "journal_types"("name");

-- AddForeignKey
ALTER TABLE "editions" ADD CONSTRAINT "editions_journalTypeId_fkey" FOREIGN KEY ("journalTypeId") REFERENCES "journal_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
