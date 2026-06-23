const { PrismaClient } = require("@prisma/client");

// ═══════════════════════════════════════════════════════════════════════════
// Script pré-build : applique les migrations structurelles via la connexion
// directe PostgreSQL (port 5432, mode session PgBouncer).
//
// PgBouncer en mode transaction (port 6543) ne supporte pas le DDL.
// Ce script dérive automatiquement l'URL directe depuis DATABASE_URL
// (6543 → 5432, retire les paramètres pgbouncer/connection_limit).
//
// IMPORTANT : Prisma conserve les noms des champs en camelCase (tel que
// défini dans le modèle). Les colonnes dans la base doivent donc être
// en camelCase (ex: dayOfWeek, NOT day_of_week).
// ═══════════════════════════════════════════════════════════════════════════

const poolUrl = process.env.DATABASE_URL;
if (!poolUrl) {
  console.error("DATABASE_URL non définie");
  process.exit(1);
}

// Dérivation de l'URL directe (port session PgBouncer)
const directUrl = poolUrl
  .replace(":6543", ":5432")
  .replace(/[?&]pgbouncer=true/, "")
  .replace(/[?&]connection_limit=\d+/g, "")
  .replace(/\?$/, "");

console.log("Connexion directe:", directUrl.slice(0, 50) + "...");

const prisma = new PrismaClient({
  datasources: { db: { url: directUrl } },
});

async function main() {
  // Augmente le statement timeout pour les opérations DDL (30s au lieu de 2s)
  await prisma.$executeRawUnsafe(`SET statement_timeout = '30000';`);

  console.log("1. Correction _prisma_migrations...");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "applied_steps_count" INTEGER NOT NULL DEFAULT 0;`
  );
  console.log("   OK");

  console.log("2. guest_editions : migration camelCase...");
  // Vérifie si la table existe avec les colonnes snake_case (ancien format).
  // Si oui, on la supprime pour la recréer en camelCase.
  const snakeCaseTable = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'guest_editions' AND column_name = 'day_of_week'
  `);
  if (Array.isArray(snakeCaseTable) && snakeCaseTable.length > 0) {
    console.log("   Ancienne table snake_case détectée, suppression...");
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "guest_editions" CASCADE;`);
    console.log("   OK");
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "guest_editions" (
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
  `);
  console.log("   Table créée (camelCase)");

  console.log("3. Indexes...");
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_dayOfWeek_key" ON "guest_editions"("dayOfWeek");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_publicToken_key" ON "guest_editions"("publicToken");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "guest_editions_dayOfWeek_idx" ON "guest_editions"("dayOfWeek");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "guest_editions_publicToken_idx" ON "guest_editions"("publicToken");`
  );
  console.log("   OK");

  console.log("4. Foreign key...");
  const fkCheck = await prisma.$queryRawUnsafe(
    `SELECT 1 FROM pg_constraint WHERE conname = 'guest_editions_editionId_fkey' LIMIT 1;`
  );
  if (Array.isArray(fkCheck) && fkCheck.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_editionId_fkey"
        FOREIGN KEY ("editionId") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    console.log("   FK créée");
  } else {
    console.log("   FK déjà existante");
  }

  console.log("5. Seed des 7 créneaux...");
  await prisma.$executeRawUnsafe(`
    INSERT INTO "guest_editions" ("id", "dayOfWeek", "dayLabel", "editionId", "publicToken", "isActive", "createdAt", "updatedAt")
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
      (1,'Lundi'),(2,'Mardi'),(3,'Mercredi'),(4,'Jeudi'),
      (5,'Vendredi'),(6,'Samedi'),(7,'Dimanche')
    ) AS v(day, label)
    WHERE NOT EXISTS (
      SELECT 1 FROM "guest_editions" WHERE "dayOfWeek" = v.day
    );
  `);
  console.log("   OK");

  // ── Autres DDL existants (portés de runtimeMigrations.ts) ──

  console.log("6. Soft-delete subscriptions...");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);`
  );
  console.log("   OK");

  console.log("7. journal_types colonnes manquantes...");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "titleTemplate" VARCHAR(255);`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "trashedUntil" TIMESTAMP(3);`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "deletedBy" TEXT;`
  );
  // Certaines colonnes existent en DB avec NOT NULL sans DEFAULT mais ne sont plus
  // dans le schéma Prisma (ex: monthlyPrice, sixMonthPrice, yearlyPrice...).
  // On détecte toutes ces colonnes et leur attribue DEFAULT 0 pour éviter les
  // violations de contrainte lors du CREATE.
  const knownCols = new Set([
    'id','name','frequency','unitPrice','titleTemplate','isActive',
    'createdAt','updatedAt','deletedAt','trashedUntil','deletedBy'
  ]);
  const extraNotNull = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'journal_types'
      AND is_nullable = 'NO'
      AND column_default IS NULL
  `);
  for (const row of extraNotNull) {
    if (!knownCols.has(row.column_name)) {
      console.log(`   journal_types."${row.column_name}" → DEFAULT 0`);
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "journal_types" ALTER COLUMN "${row.column_name}" SET DEFAULT 0;`
      ).catch(() => {});
    }
  }
  console.log("   OK");

  console.log("8. app_settings...");
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "app_settings" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());`
  );
  console.log("   OK");

  console.log("9. Enum SystemEventType...");
  await prisma.$executeRawUnsafe(
    "DO $$ BEGIN " +
      "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'MODIFICATION_ABONNEMENT';" +
      "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_ABONNEMENT';" +
      "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'SUPPRESSION_DEFINITIVE_ABONNEMENT';" +
      "ALTER TYPE \"SystemEventType\" ADD VALUE IF NOT EXISTS 'RESTAURATION_ABONNEMENT';" +
    "END $$;"
  );
  console.log("   OK");

  // Vérification finale
  const count = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS c FROM "guest_editions";`
  );
  console.log(`\nTable guest_editions : ${count[0]?.c ?? "?"} créneaux`);

  console.log("10. Seed app_settings...");
  await prisma.$executeRaw`
    INSERT INTO "app_settings" ("key", "value")
    VALUES (${"registration"}, ${JSON.stringify({ enabled: true })}::jsonb)
    ON CONFLICT ("key") DO NOTHING;
  `;
  console.log("   OK");

  console.log("11. Seed types de journaux manquants...");
  const journalTypeSeeds = [
    { name: "Cameroon Business Today", frequency: "HEBDOMADAIRE", unitPrice: 500,  titleTemplate: "Cameroon Business Today - {{date_long}}" },
    { name: "Cameroon Insider",        frequency: "HEBDOMADAIRE", unitPrice: 500,  titleTemplate: "Cameroon Insider - {{date_long}}" },
    { name: "Nyanga Magazine",         frequency: "MENSUEL",      unitPrice: 1500, titleTemplate: "Nyanga Magazine - {{date_long}}" },
  ];
  for (const jt of journalTypeSeeds) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "journal_types" ("id","name","frequency","unitPrice","isActive","createdAt","updatedAt")
      VALUES (
        md5(random()::text || clock_timestamp()::text),
        '${jt.name}', '${jt.frequency}', ${jt.unitPrice}, true, NOW(), NOW()
      )
      ON CONFLICT ("name") DO NOTHING;
    `);
    console.log(`   ${jt.name} : OK`);
  }
  console.log("   OK");

  await prisma.$disconnect();
  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
