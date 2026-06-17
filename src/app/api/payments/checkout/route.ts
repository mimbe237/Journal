import { NextRequest, NextResponse } from "next/server";
import { SubscriptionSource, SubscriptionType } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { startCheckout } from "@/modules/payments/paymentService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { subscriptionType, amount, currency, durationDays } = body ?? {};

    if (!subscriptionType || !Object.values(SubscriptionType).includes(subscriptionType)) {
      return NextResponse.json({ error: "subscriptionType invalide" }, { status: 400 });
    }
    if (typeof amount !== "number" || Number.isNaN(amount) || amount < 0) {
      return NextResponse.json({ error: "amount doit être >= 0" }, { status: 400 });
    }

    const session = await startCheckout({
      userId: user.id,
      subscriptionType,
      amount,
      currency,
      durationDays,
      source: SubscriptionSource.ONLINE,
      userEmail: user.email
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur checkout" }, { status: 400 });
  }
}
