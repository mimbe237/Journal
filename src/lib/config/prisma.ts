import { PrismaClient } from "@prisma/client";

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
        console.log("Auto-fixed DATABASE_URL to include pgbouncer=true");
      }
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

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
