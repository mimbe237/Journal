import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { markPaymentFailure, markPaymentSuccess } from "@/modules/payments/paymentService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { sessionId, status } = body ?? {};

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
    }

    if (status === "success") {
      await markPaymentSuccess({ sessionId, userId: user.id });
      return NextResponse.json({ ok: true, status: "success" }, { status: 200 });
    }
    if (status === "failure") {
      await markPaymentFailure({ sessionId, userId: user.id });
      return NextResponse.json({ ok: true, status: "failure" }, { status: 200 });
    }

    return NextResponse.json({ error: "status doit être 'success' ou 'failure'" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur confirmation" }, { status: 400 });
  }
}
