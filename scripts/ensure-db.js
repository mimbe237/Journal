const { PrismaClient } = require("@prisma/client");

// ═══════════════════════════════════════════════════════════════════════════
// Script pré-build : applique les migrations structurelles via la connexion
// directe PostgreSQL (port 5432, mode session PgBouncer).
//
// PgBouncer en mode transaction (port 6543) ne supporte pas le DDL.
// Ce script dérive automatiquement l'URL directe depuis DATABASE_URL
// (6543 → 5432, retire les paramètres pgbouncer/connection_limit).
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
  console.log("1. Correction _prisma_migrations...");
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "applied_steps_count" INTEGER NOT NULL DEFAULT 0;`
  );
  console.log("   OK");

  console.log("2. Création table guest_editions...");
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
  console.log("   OK");

  console.log("3. Indexes...");
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_day_of_week_key" ON "guest_editions"("day_of_week");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "guest_editions_public_token_key" ON "guest_editions"("public_token");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "guest_editions_day_of_week_idx" ON "guest_editions"("day_of_week");`
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "guest_editions_public_token_idx" ON "guest_editions"("public_token");`
  );
  console.log("   OK");

  console.log("4. Foreign key...");
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "guest_editions" ADD CONSTRAINT "guest_editions_edition_id_fkey"
        FOREIGN KEY ("edition_id") REFERENCES "editions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log("   OK");

  console.log("5. Seed des 7 créneaux...");
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
      (1,'Lundi'),(2,'Mardi'),(3,'Mercredi'),(4,'Jeudi'),
      (5,'Vendredi'),(6,'Samedi'),(7,'Dimanche')
    ) AS v(day, label)
    WHERE NOT EXISTS (
      SELECT 1 FROM "guest_editions" WHERE "day_of_week" = v.day
    );
  `);
  console.log("   OK");

  // Vérification finale
  const count = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS c FROM "guest_editions";`
  );
  console.log(`\nTable guest_editions : ${count[0]?.c ?? "?"} créneaux`);

  await prisma.$disconnect();
  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
