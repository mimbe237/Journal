import type { PrismaClient } from "@prisma/client";

let runtimeMigrationPromise: Promise<void> | null = null;

async function applyRuntimeMigrations(prisma: PrismaClient) {
  // Ajoute les colonnes de soft delete si elles n'existent pas encore.
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);'
    );
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure subscription soft-delete columns", error);
  }

  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "titleTemplate" VARCHAR(255);'
    );

    const [legacyColumn] = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'journal_types'
          AND column_name = 'title_template'
      ) AS "exists"
    `;

    if (legacyColumn?.exists) {
      await prisma.$executeRawUnsafe(
        'UPDATE "journal_types" SET "titleTemplate" = COALESCE("titleTemplate", "title_template");'
      );
    }
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure journal_types titleTemplate column", error);
  }

  // Tableau de configuration applicative (feature flags simples).
  try {
    await prisma.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "app_settings" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());'
    );
    await prisma.$executeRaw`
      INSERT INTO "app_settings" ("key", "value")
      VALUES (${"registration"}, ${JSON.stringify({ enabled: true })}::jsonb)
      ON CONFLICT ("key") DO NOTHING;
    `;
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure app_settings table", error);
  }

  // Table guest_editions pour le module éditions invitées (idempotent).
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "guest_editions" (
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
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_day_of_week_key" ON "guest_editions"("day_of_week");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_public_token_key" ON "guest_editions"("public_token");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "guest_editions_day_of_week_idx" ON "guest_editions"("day_of_week");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "guest_editions_public_token_idx" ON "guest_editions"("public_token");
    `);

    // FK : vérifie si elle existe déjà avant d'ajouter
    const [fkeyExists] = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint FROM pg_constraint WHERE conname = 'guest_editions_edition_id_fkey'`
    );
    if (Number(fkeyExists.count) === 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_edition_id_fkey"
        FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    }

    // Seed des 7 créneaux (lundi à dimanche) — idempotent, ne modifie pas les slots déjà configurés
    await prisma.$executeRawUnsafe(`
      INSERT INTO "guest_editions" ("id", "day_of_week", "day_label", "edition_id", "public_token", "is_active", "created_at", "updated_at") VALUES
        (gen_random_uuid(), 1, 'Lundi',    NULL, gen_random_uuid(), true, NOW(), NOW()),
        (gen_random_uuid(), 2, 'Mardi',    NULL, gen_random_uuid(), true, NOW(), NOW()),
        (gen_random_uuid(), 3, 'Mercredi', NULL, gen_random_uuid(), true, NOW(), NOW()),
        (gen_random_uuid(), 4, 'Jeudi',    NULL, gen_random_uuid(), true, NOW(), NOW()),
        (gen_random_uuid(), 5, 'Vendredi', NULL, gen_random_uuid(), true, NOW(), NOW()),
        (gen_random_uuid(), 6, 'Samedi',   NULL, gen_random_uuid(), true, NOW(), NOW()),
        (gen_random_uuid(), 7, 'Dimanche', NULL, gen_random_uuid(), true, NOW(), NOW())
      ON CONFLICT ("day_of_week") DO UPDATE
        SET "day_label" = EXCLUDED."day_label";
    `);
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure guest_editions table", error);
  }

  // Ajoute les valeurs d'énumération manquantes pour SystemEventType (idempotent).
  try {
    await prisma.$executeRawUnsafe(
      "DO $$ BEGIN " +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'MODIFICATION_ABONNEMENT';" +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_ABONNEMENT';" +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_DEFINITIVE_ABONNEMENT';" +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'RESTAURATION_ABONNEMENT';" +
      "END $$;"
    );
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure SystemEventType values", error);
  }
}

export function ensureSubscriptionRuntimeMigrations(prisma: PrismaClient): Promise<void> {
  if (!runtimeMigrationPromise) {
    runtimeMigrationPromise = applyRuntimeMigrations(prisma);
  }
  return runtimeMigrationPromise;
}
