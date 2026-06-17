import { PrismaClient } from "@prisma/client";

// ═══════════════════════════════════════════════════════════════════════════
// DDL Client — connexion session PgBouncer (port 5432) pour CREATE/ALTER
// ═══════════════════════════════════════════════════════════════════════════
//
// PgBouncer transaction (port 6543) ne supporte pas le DDL. On utilise
// donc le mode session (port 5432) avec connection_limit=1 pour ne jamais
// saturer le pool (limité à 15 connexions chez Supabase).
//
// Toutes les opérations DDL sont sérialisées via un mutex (chaîne de
// promesses) : une seule connexion DDL à la fois, quel que soit le nombre
// de requêtes API concurrentes.
//
// Pendant le build Next.js (static generation), le DDL est ignoré — la
// table sera créée au premier appel API en production.

let _ddlPrisma: PrismaClient | null = null;
let _ddlQueue: Promise<void> = Promise.resolve();

// Détermine si on est en phase de build Next.js (static generation).
// Pendant le build, des dizaines de pages sont rendues en parallèle et
// chacune importerait prisma → ouvrirait N connexions DDL → saturerait
// le pool session. On ignore donc le DDL pendant le build.
function isBuildTime(): boolean {
  return (
    // NEXT_PHASE est défini par Next.js uniquement pendant le build
    process.env.NEXT_PHASE !== undefined ||
    // Sur Vercel, VERCEL_ENV vaut "production" en prod ; si absent, on
    // est probablement en build local et NEXT_RUNTIME n'est pas défini
    (process.env.VERCEL_ENV === undefined &&
      typeof process.env.NEXT_RUNTIME === "undefined" &&
      process.env.NODE_ENV !== "development")
  );
}

function deriveDirectUrl(): string {
  const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  return (
    url
      // Port transaction (6543) → port session (5432)
      .replace(":6543", ":5432")
      // Retire les paramètres inutiles en mode session
      .replace(/[?&]pgbouncer=true/, "")
      .replace(/[?&]connection_limit=\d+/g, "")
      // Nettoie les séparateurs résiduels
      .replace(/(\?)(&)/, "?")
      .replace(/\?$/, "")
      // connection_limit=1 : ne JAMAIS prendre plus d'une connexion
      // dans le pool session Supabase (limité à 15)
      + (url.includes("?") ? "&" : "?") +
      "connection_limit=1"
  );
}

async function getDdlPrisma(): Promise<PrismaClient> {
  if (_ddlPrisma) return _ddlPrisma;
  const directUrl = deriveDirectUrl();
  console.log("[runtime-migrations] DDL client connecting (session mode, limit=1)");
  _ddlPrisma = new PrismaClient({
    datasources: { db: { url: directUrl } },
  });
  await _ddlPrisma.$connect();
  console.log("[runtime-migrations] DDL client connected");
  return _ddlPrisma;
}

async function disconnectDdlPrisma(): Promise<void> {
  if (_ddlPrisma) {
    await _ddlPrisma.$disconnect();
    _ddlPrisma = null;
    console.log("[runtime-migrations] DDL client disconnected");
  }
}

// Exécute une opération DDL de manière sérialisée.
// Tous les appels à runDdl sont mis en file d'attente et exécutés
// un par un via la même connexion (connection_limit=1).
async function runDdl(
  name: string,
  fn: (ddl: PrismaClient) => Promise<void>
): Promise<void> {
  _ddlQueue = _ddlQueue.then(async () => {
    try {
      const ddl = await getDdlPrisma();
      await fn(ddl);
      console.log(`[runtime-migrations] DDL OK: ${name}`);
    } catch (error) {
      console.error(`[runtime-migrations] DDL FAILED: ${name}`, error);
    }
  });
  await _ddlQueue;
}

let runtimeMigrationPromise: Promise<void> | null = null;

async function applyRuntimeMigrations(poolerPrisma: PrismaClient) {
  // Pendant le build Next.js, on ignore le DDL pour ne pas saturer
  // le pooler session. La table sera créée au premier appel API.
  if (isBuildTime()) {
    console.log("[runtime-migrations] build détecté, DDL ignoré (sera exécuté au runtime)");
    return;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 1. Corrige la table de tracking Prisma
  // ═══════════════════════════════════════════════════════════════════
  await runDdl("_prisma_migrations.applied_steps_count", async (ddl) => {
    await ddl.$executeRawUnsafe(
      `ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "applied_steps_count" INTEGER NOT NULL DEFAULT 0;`
    );
  });

  // ═══════════════════════════════════════════════════════════════════
  // 2. Table guest_editions
  // ═══════════════════════════════════════════════════════════════════
  await runDdl("guest_editions CREATE TABLE", async (ddl) => {
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
  });

  await runDdl("guest_editions indexes", async (ddl) => {
    await ddl.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_day_of_week_key" ON "guest_editions"("day_of_week");`
    );
    await ddl.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_public_token_key" ON "guest_editions"("public_token");`
    );
    await ddl.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "guest_editions_day_of_week_idx" ON "guest_editions"("day_of_week");`
    );
    await ddl.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "guest_editions_public_token_idx" ON "guest_editions"("public_token");`
    );
  });

  await runDdl("guest_editions FK", async (ddl) => {
    await ddl.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_edition_id_fkey"
          FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 3. Seed des 7 créneaux (via pooler, pas de DDL)
  // ═══════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════
  // 4. Autres DDL existants (soft-delete, journal_types, etc.)
  // ═══════════════════════════════════════════════════════════════════
  await runDdl("subscriptions soft-delete columns", async (ddl) => {
    await ddl.$executeRawUnsafe(
      'ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);'
    );
  });

  await runDdl("journal_types titleTemplate", async (ddl) => {
    await ddl.$executeRawUnsafe(
      'ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "titleTemplate" VARCHAR(255);'
    );
    const [legacyColumn] = await ddl.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
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
  });

  await runDdl("app_settings table", async (ddl) => {
    await ddl.$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "app_settings" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());'
    );
    await ddl.$executeRaw`
      INSERT INTO "app_settings" ("key", "value")
      VALUES (${"registration"}, ${JSON.stringify({ enabled: true })}::jsonb)
      ON CONFLICT ("key") DO NOTHING;
    `;
  });

  await runDdl("SystemEventType enum values", async (ddl) => {
    await ddl.$executeRawUnsafe(
      "DO $$ BEGIN " +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'MODIFICATION_ABONNEMENT';" +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_ABONNEMENT';" +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_DEFINITIVE_ABONNEMENT';" +
        "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'RESTAURATION_ABONNEMENT';" +
      "END $$;"
    );
  });

  // Libère la connexion DDL
  await disconnectDdlPrisma();
}

export function ensureSubscriptionRuntimeMigrations(
  prisma: PrismaClient
): Promise<void> {
  if (!runtimeMigrationPromise) {
    runtimeMigrationPromise = applyRuntimeMigrations(prisma);
  }
  return runtimeMigrationPromise;
}
