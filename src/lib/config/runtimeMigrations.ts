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

  // Seed des 7 créneaux guest_editions (lundi à dimanche).
  // La table est créée par la migration Prisma classique (via directUrl).
  // Ce bloc ne fait que peupler les slots s'ils n'existent pas encore.
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "guest_editions" ("id", "day_of_week", "day_label", "edition_id", "public_token", "is_active", "created_at", "updated_at")
      SELECT
        md5(random()::text || clock_timestamp()::text),
        v.day,
        v.label,
        NULL,
        md5(random()::text || clock_timestamp()::text),
        true,
        NOW(),
        NOW()
      FROM (VALUES
        (1, 'Lundi'),
        (2, 'Mardi'),
        (3, 'Mercredi'),
        (4, 'Jeudi'),
        (5, 'Vendredi'),
        (6, 'Samedi'),
        (7, 'Dimanche')
      ) AS v(day, label)
      WHERE NOT EXISTS (
        SELECT 1 FROM "guest_editions" WHERE "day_of_week" = v.day
      );
    `);
    console.log("[runtime-migrations] guest_editions slots seeded");
  } catch (error) {
    console.error("[runtime-migrations] guest_editions seed failed", error);
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
