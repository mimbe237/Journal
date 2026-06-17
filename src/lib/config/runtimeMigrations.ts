import type { PrismaClient } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════════════
// Runtime Migrations légères.
//
// Seules les opérations ALTER TABLE ADD COLUMN IF NOT EXISTS sont exécutées
// ici (fonctionnent avec PgBouncer transaction). Les CREATE TABLE complexes
// sont gérées par le script pré-build `scripts/ensure-db.js` (connexion
// directe port 5432).
//
// Pendant le build Next.js, toutes les opérations sont ignorées.
// ═══════════════════════════════════════════════════════════════════════════

let runtimeMigrationPromise: Promise<void> | null = null;

function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE !== undefined ||
    (process.env.VERCEL_ENV === undefined &&
      typeof process.env.NEXT_RUNTIME === "undefined" &&
      process.env.NODE_ENV !== "development")
  );
}

async function applyRuntimeMigrations(prisma: PrismaClient) {
  if (isBuildTime()) {
    console.log("[runtime-migrations] build détecté, ignoré");
    return;
  }

  // Soft-delete sur subscriptions
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);'
    );
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure subscription soft-delete columns", error);
  }

  // journal_types titleTemplate
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

  // Tableau de configuration applicative
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

  // Enum SystemEventType
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

  console.log("[runtime-migrations] terminé");
}

export function ensureSubscriptionRuntimeMigrations(prisma: PrismaClient): Promise<void> {
  if (!runtimeMigrationPromise) {
    runtimeMigrationPromise = applyRuntimeMigrations(prisma);
  }
  return runtimeMigrationPromise;
}
