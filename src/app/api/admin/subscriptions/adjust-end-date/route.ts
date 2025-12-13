import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { adjustSubscriptionEndDate } from "@/modules/subscriptions/subscriptionService";

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION]);

    const admin = await getCurrentUserFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Admin non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, nouvelleDateFin, raison } = body ?? {};

    const subscription = await adjustSubscriptionEndDate({
      subscriptionId,
      nouvelleDateFin: new Date(nouvelleDateFin),
      raison,
      adminId: admin.id
    });

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'ajustement" }, { status: 400 });
  }
}
