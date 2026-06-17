import { PrismaClient } from "@prisma/client";

// ─── DDL Client ────────────────────────────────────────────────────────────
// Connexion directe à PostgreSQL (port 5432, session PgBouncer) pour les
// opérations DDL (CREATE TABLE, ALTER TABLE) que PgBouncer transaction
// (port 6543) ne supporte pas.
// Pour les queries normales, le client standard (pooler) est utilisé.
let _ddlPrisma: PrismaClient | null = null;

function getDdlPrisma(): PrismaClient {
  if (_ddlPrisma) return _ddlPrisma;
  const directUrl = process.env.DIRECT_DATABASE_URL;
  if (!directUrl) {
    console.warn("[runtime-migrations] DIRECT_DATABASE_URL non défini, DDL ignoré");
  }
  _ddlPrisma = new PrismaClient({
    datasources: { db: { url: directUrl ?? process.env.DATABASE_URL } },
  });
  return _ddlPrisma;
}

async function disconnectDdlPrisma(): Promise<void> {
  if (_ddlPrisma) {
    await _ddlPrisma.$disconnect();
    _ddlPrisma = null;
  }
}

let runtimeMigrationPromise: Promise<void> | null = null;

async function applyRuntimeMigrations(poolerPrisma: PrismaClient) {
  const ddl = getDdlPrisma();

  // ── 1. DDL via connexion directe (PgBouncer session, port 5432) ──────

  // 1a. Corrige la table de tracking _prisma_migrations pour Prisma 5.22+
  try {
    await ddl.$executeRawUnsafe(
      `ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "applied_steps_count" INTEGER NOT NULL DEFAULT 0;`
    );
    console.log("[runtime-migrations] _prisma_migrations.applied_steps_count ensured");
  } catch (error) {
    console.error("[runtime-migrations] _prisma_migrations fix failed", error);
  }

  // 1b. Table guest_editions
  try {
    await ddl.$executeRawUnsafe(`
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
    console.log("[runtime-migrations] guest_editions table ensured");
  } catch (error) {
    console.error("[runtime-migrations] guest_editions CREATE TABLE failed", error);
  }

  // Indexes
  try {
    await ddl.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_day_of_week_key" ON "guest_editions"("day_of_week");`);
    await ddl.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_public_token_key" ON "guest_editions"("public_token");`);
    await ddl.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "guest_editions_day_of_week_idx" ON "guest_editions"("day_of_week");`);
    await ddl.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "guest_editions_public_token_idx" ON "guest_editions"("public_token");`);
    console.log("[runtime-migrations] guest_editions indexes ensured");
  } catch (error) {
    console.error("[runtime-migrations] guest_editions indexes failed", error);
  }

  // FK
  try {
    await ddl.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_edition_id_fkey"
          FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("[runtime-migrations] guest_editions FK ensured");
  } catch (error) {
    console.error("[runtime-migrations] guest_editions FK failed", error);
  }

  // ── 2. Seed via pooler (INSERT, pas de DDL) ───────────────────────────

  try {
    await poolerPrisma.$executeRawUnsafe(`
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

  // ── 3. DDL existant (soft-delete, journal_types, app_settings, etc.) ──
  // Ces opérations sont déplacées vers le client DDL pour éviter
  // les blocages PgBouncer.

  try {
    await ddl.$executeRawUnsafe(
      'ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);'
    );
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure subscription soft-delete columns", error);
  }

  try {
    await ddl.$executeRawUnsafe(
      'ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "titleTemplate" VARCHAR(255);'
    );

    const [legacyColumn] = await ddl.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'journal_types'
          AND column_name = 'title_template'
      ) AS "exists"
    `;

    if (legacyColumn?.exists) {
      await ddl.$executeRawUnsafe(
        'UPDATE "journal_types" SET "titleTemplate" = COALESCE("titleTemplate", "title_template");'
      );
    }
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure journal_types titleTemplate column", error);
  }

  try {
    await ddl.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "app_settings" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());'
    );
    await ddl.$executeRaw`
      INSERT INTO "app_settings" ("key", "value")
      VALUES (${"registration"}, ${JSON.stringify({ enabled: true })}::jsonb)
      ON CONFLICT ("key") DO NOTHING;
    `;
  } catch (error) {
    console.error("[runtime-migrations] failed to ensure app_settings table", error);
  }

  // Ajoute les valeurs d'énumération manquantes pour SystemEventType (idempotent).
  try {
    await ddl.$executeRawUnsafe(
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

  // Déconnecte le client DDL une fois les migrations terminées
  await disconnectDdlPrisma();
}

export function ensureSubscriptionRuntimeMigrations(prisma: PrismaClient): Promise<void> {
  if (!runtimeMigrationPromise) {
    runtimeMigrationPromise = applyRuntimeMigrations(prisma);
  }
  return runtimeMigrationPromise;
}
