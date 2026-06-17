import { PrismaClient } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════════════
// Runtime Migrations — tout passe par le client pooler standard (port 6543)
// ═══════════════════════════════════════════════════════════════════════════
//
// CREATE TABLE IF NOT EXISTS et ALTER TABLE ADD COLUMN IF NOT EXISTS sont
// des instructions SQL uniques qui fonctionnent avec PgBouncer en mode
// transaction. Seul Prisma migrate deploy (multi-statement) ne fonctionne
// pas — d'où ce fichier.
//
// Pendant le build Next.js (static generation), le DDL est ignoré pour ne
// pas saturer le pool. La table sera créée au premier appel API en prod.

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

  console.log("[runtime-migrations] démarrage...");

  // ── _prisma_migrations.applied_steps_count ──
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "applied_steps_count" INTEGER NOT NULL DEFAULT 0;`
    );
    console.log("[runtime-migrations] _prisma_migrations OK");
  } catch (e) {
    console.error("[runtime-migrations] _prisma_migrations FAILED", e);
  }

  // ── guest_editions ──
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
    console.log("[runtime-migrations] guest_editions CREATE TABLE OK");
  } catch (e) {
    console.error("[runtime-migrations] guest_editions CREATE TABLE FAILED", e);
    return; // pas la peine de continuer
  }

  // Indexes
  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_day_of_week_key" ON "guest_editions"("day_of_week");`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_public_token_key" ON "guest_editions"("public_token");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "guest_editions_day_of_week_idx" ON "guest_editions"("day_of_week");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "guest_editions_public_token_idx" ON "guest_editions"("public_token");`);
    console.log("[runtime-migrations] guest_editions indexes OK");
  } catch (e) {
    console.error("[runtime-migrations] guest_editions indexes FAILED", e);
  }

  // FK
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_edition_id_fkey"
          FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log("[runtime-migrations] guest_editions FK OK");
  } catch (e) {
    console.error("[runtime-migrations] guest_editions FK FAILED", e);
  }

  // Seed des 7 créneaux
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "guest_editions" ("id", "day_of_week", "day_label", "edition_id", "public_token", "is_active", "created_at", "updated_at")
      SELECT md5(random()::text || clock_timestamp()::text), v.day, v.label, NULL, md5(random()::text || clock_timestamp()::text), true, NOW(), NOW()
      FROM (VALUES (1,'Lundi'),(2,'Mardi'),(3,'Mercredi'),(4,'Jeudi'),(5,'Vendredi'),(6,'Samedi'),(7,'Dimanche')) AS v(day, label)
      WHERE NOT EXISTS (SELECT 1 FROM "guest_editions" WHERE "day_of_week" = v.day);
    `);
    console.log("[runtime-migrations] guest_editions seed OK");
  } catch (e) {
    console.error("[runtime-migrations] guest_editions seed FAILED", e);
  }

  // ── Autres migrations existantes ──
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);');
  } catch {}
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "titleTemplate" VARCHAR(255);');
  } catch {}
  try {
    await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "app_settings" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());');
    await prisma.$executeRaw`INSERT INTO "app_settings" ("key","value") VALUES (${"registration"},${JSON.stringify({enabled:true})}::jsonb) ON CONFLICT DO NOTHING;`;
  } catch {}
  try {
    await prisma.$executeRawUnsafe("DO $$ BEGIN ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'MODIFICATION_ABONNEMENT'; ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_ABONNEMENT'; ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_DEFINITIVE_ABONNEMENT'; ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'RESTAURATION_ABONNEMENT'; END $$;");
  } catch {}

  console.log("[runtime-migrations] terminé");
}

export function ensureSubscriptionRuntimeMigrations(prisma: PrismaClient): Promise<void> {
  if (!runtimeMigrationPromise) {
    runtimeMigrationPromise = applyRuntimeMigrations(prisma);
  }
  return runtimeMigrationPromise;
}
