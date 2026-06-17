-- CreateTable (camelCase, comme toutes les autres migrations Prisma de ce projet)
CREATE TABLE "guest_editions" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "editionId" TEXT,
    "publicToken" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_editions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_editions_dayOfWeek_key" ON "guest_editions"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "guest_editions_publicToken_key" ON "guest_editions"("publicToken");

-- CreateIndex
CREATE INDEX "guest_editions_dayOfWeek_idx" ON "guest_editions"("dayOfWeek");

-- CreateIndex
CREATE INDEX "guest_editions_publicToken_idx" ON "guest_editions"("publicToken");

-- AddForeignKey
ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
