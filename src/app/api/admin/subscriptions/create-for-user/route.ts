import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { createSubscriptionForUser } from "@/modules/subscriptions/subscriptionService";

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION]);

    const body = await req.json();
    const { userId, type, dateDebut, dateFin, montant, devise, source, promoCodeId } = body ?? {};

    const subscription = await createSubscriptionForUser({
      userId,
      type,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      montant,
      devise,
      source,
      promoCodeId,
      paymentMethod: null
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la création" }, { status: 400 });
  }
}
