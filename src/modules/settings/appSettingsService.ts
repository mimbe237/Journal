import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";

const REGISTRATION_KEY = "registration";

async function ensureSettingsTable() {
  await prismaRuntimeReady;
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "app_settings" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());'
  );
  await prisma.$executeRaw`
    INSERT INTO "app_settings" ("key", "value")
    VALUES (${REGISTRATION_KEY}, ${JSON.stringify({ enabled: true })}::jsonb)
    ON CONFLICT ("key") DO NOTHING;
  `;
}

export async function getRegistrationEnabled(): Promise<boolean> {
  await ensureSettingsTable();
  const rows = await prisma.$queryRaw<{ value: any }[]>`
    SELECT value FROM "app_settings" WHERE "key" = ${REGISTRATION_KEY} LIMIT 1;
  `;
  const value = rows?.[0]?.value;
  return value?.enabled !== false;
}

export async function setRegistrationEnabled(enabled: boolean): Promise<void> {
  await ensureSettingsTable();
  await prisma.$executeRaw`
    INSERT INTO "app_settings" ("key", "value")
    VALUES (${REGISTRATION_KEY}, ${JSON.stringify({ enabled })}::jsonb)
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED.value, "updatedAt" = now();
  `;
}
