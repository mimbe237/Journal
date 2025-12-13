import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { cancelOrRefundSubscription } from "@/modules/subscriptions/subscriptionService";

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION]);

    const admin = await getCurrentUserFromRequest(req);
    if (!admin) {
      return NextResponse.json({ error: "Admin non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { subscriptionId, typeOperation, raison } = body ?? {};

    const subscription = await cancelOrRefundSubscription({
      subscriptionId,
      typeOperation,
      raison,
      adminId: admin.id
    });

    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'opération" }, { status: 400 });
  }
}
