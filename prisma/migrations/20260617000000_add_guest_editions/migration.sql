-- CreateTable
CREATE TABLE "guest_editions" (
    "id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "day_label" TEXT NOT NULL,
    "edition_id" TEXT,
    "public_token" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_editions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_editions_day_of_week_key" ON "guest_editions"("day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "guest_editions_public_token_key" ON "guest_editions"("public_token");

-- CreateIndex
CREATE INDEX "guest_editions_day_of_week_idx" ON "guest_editions"("day_of_week");

-- CreateIndex
CREATE INDEX "guest_editions_public_token_idx" ON "guest_editions"("public_token");

-- AddForeignKey
ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_edition_id_fkey" FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
