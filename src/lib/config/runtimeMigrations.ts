import { PrismaClient } from "@prisma/client";

// Runtime migrations — Aucun DDL au runtime.
// Tout le DDL (CREATE TABLE, ALTER TABLE, ALTER TYPE) est exécuté
// par scripts/ensure-db.js via connexion directe (port 5432) avant le build.
// Ce fichier ne fait rien ; il existe uniquement pour maintenir la
// compatibilité du contrat d'interface (prismaRuntimeReady).

let runtimeMigrationPromise: Promise<void> | null = null;

function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE !== undefined ||
    (process.env.VERCEL_ENV === undefined &&
      typeof process.env.NEXT_RUNTIME === "undefined" &&
      process.env.NODE_ENV !== "development")
  );
}

async function applyRuntimeMigrations(_prisma: PrismaClient) {
  if (isBuildTime()) return;
  // Rien à faire : tout le DDL est dans scripts/ensure-db.js
}

export function ensureSubscriptionRuntimeMigrations(prisma: PrismaClient): Promise<void> {
  if (!runtimeMigrationPromise) {
    runtimeMigrationPromise = applyRuntimeMigrations(prisma);
  }
  return runtimeMigrationPromise;
}
