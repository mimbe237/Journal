import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { createSubscriptionForEnterprise } from "@/modules/subscriptions/subscriptionService";

function sanitizeDevise(devise: string | null | undefined) {
  if (!devise) return "XAF";
  const up = devise.toUpperCase();
  if (up === "FCFA") return "XAF";
  return up.slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION]);

    const body = await req.json();
    const {
      enterpriseAccountId,
      type,
      dateDebut,
      dateFin,
      montant,
      devise: rawDevise,
      source,
      promoCodeId
    } = body ?? {};

    const devise = sanitizeDevise(rawDevise);

    const subscription = await createSubscriptionForEnterprise({
      enterpriseAccountId,
      type,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      montant,
      devise,
      source,
      promoCodeId
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la création" }, { status: 400 });
  }
}
