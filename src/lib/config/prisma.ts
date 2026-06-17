import { PrismaClient } from "@prisma/client";
import { ensureSubscriptionRuntimeMigrations } from "./runtimeMigrations";

// Client Prisma unique pour éviter les reconnections en dev (hot-reload Next.js).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL;
  if (process.env.NODE_ENV === "production" && url) {
    // Fix automatique pour Supabase Transaction Pooler sur Vercel
    if (url.includes("pooler.supabase.com") || url.includes(":6543")) {
      if (!url.includes("pgbouncer=true")) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}pgbouncer=true`;
      }
      if (!url.includes("connection_limit=")) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}connection_limit=1`;
      }
      console.log("Auto-fixed DATABASE_URL to include pgbouncer=true & connection_limit=1");
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
  throw error;
});

export async function ensurePrismaRuntimeMigrations() {
  await runtimeMigrationsPromise;
}

export const prismaRuntimeReady = runtimeMigrationsPromise;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
