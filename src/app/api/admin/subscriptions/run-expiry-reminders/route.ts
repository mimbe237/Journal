import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { processSubscriptionExpiryReminders } from "@/modules/subscriptions/subscriptionReminderService";

// Endpoint déclenchable par un cron externe (ex: 1x/jour) pour envoyer les rappels d'expiration.
// TODO: ajouter un "cron token" secret (header ou query) pour autoriser des appels sans session si nécessaire.
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION]);

    const now = new Date();
    await processSubscriptionExpiryReminders(now);

    return NextResponse.json({ success: true, runAt: now.toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'exécution des rappels" }, { status: 400 });
  }
}
