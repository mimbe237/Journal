import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { updateReadingSessionOnPageView } from "@/modules/editions/readingSessionService";

// Mise à jour d'une session de lecture lors d'un changement de page (front explicite).
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { sessionId, pageNumber } = body ?? {};
    if (!sessionId || typeof pageNumber !== "number") {
      return NextResponse.json({ error: "sessionId et pageNumber requis" }, { status: 400 });
    }

    const session = await updateReadingSessionOnPageView({ sessionId, pageNumber });
    return NextResponse.json({ sessionId: session.id }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la mise à jour" }, { status: 400 });
  }
}
