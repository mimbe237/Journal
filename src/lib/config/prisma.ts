import { PrismaClient } from "@prisma/client";
import { ensureSubscriptionRuntimeMigrations } from "./runtimeMigrations";

// Client Prisma unique pour éviter les reconnections en dev (hot-reload Next.js).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL;
  if (process.env.NODE_ENV === "production" && url) {
    // Ajoute pgbouncer=true pour Supabase Transaction Pooler sur Vercel.
    // Les migrations Prisma utilisent DIRECT_DATABASE_URL (connexion directe
    // sans PgBouncer), donc aucun connection_limit n'est nécessaire ici.
    if (url.includes("pooler.supabase.com") || url.includes(":6543")) {
      if (!url.includes("pgbouncer=true")) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}pgbouncer=true`;
      }
      console.log("[prisma] Pooler Supabase détecté, pgbouncer=true ajouté");
    }
  }
  return url;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

const runtimeMigrationsPromise = ensureSubscriptionRuntimeMigrations(prisma).catch((error) => {
  console.error("[prisma] runtime migrations failed", error);
  // Ne jamais rejeter : cela bloquerait toutes les APIs qui utilisent prismaRuntimeReady.
  // Les erreurs sont loggées, le DDL est géré par scripts/ensure-db.js avant le build.
});

export async function ensurePrismaRuntimeMigrations() {
  await runtimeMigrationsPromise;
}

export const prismaRuntimeReady = runtimeMigrationsPromise;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
