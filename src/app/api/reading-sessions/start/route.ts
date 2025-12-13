import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { startReadingSession } from "@/modules/editions/readingSessionService";
import { getClientIp, getUserAgent } from "@/lib/http/requestContext";

// Démarre explicitement une session de lecture. TODO: brancher depuis le front (EditionReader) si besoin.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { editionId, pageDebut } = body ?? {};
    if (!editionId || typeof pageDebut !== "number") {
      return NextResponse.json({ error: "editionId et pageDebut requis" }, { status: 400 });
    }

    const session = await startReadingSession({
      userId: user.id,
      editionId,
      pageDebut,
      adresseIp: getClientIp(req),
      userAgent: getUserAgent(req)
    });

    return NextResponse.json({ sessionId: session.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors du démarrage de session" }, { status: 400 });
  }
}
