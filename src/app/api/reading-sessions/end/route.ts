import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { endReadingSession } from "@/modules/editions/readingSessionService";

// Termine explicitement une session (peut être appelé au déchargement).
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { sessionId } = body ?? {};
    if (!sessionId) return NextResponse.json({ error: "sessionId requis" }, { status: 400 });

    const session = await endReadingSession({ sessionId });
    return NextResponse.json({ sessionId: session.id }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la fermeture de session" }, { status: 400 });
  }
}
