import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { startReadingSession, updateReadingSessionOnPageView } from "@/modules/editions/readingSessionService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const body = await req.json();
    const { page, sessionId } = body;

    if (!sessionId) {
      // Start new session
      const session = await startReadingSession({
        userId: user.id,
        editionId: id,
        pageDebut: page || 1,
        adresseIp: req.headers.get("x-forwarded-for") || (req as any).ip || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      });
      return NextResponse.json({ sessionId: session.id });
    } else {
      // Update existing session
      await updateReadingSessionOnPageView({
        sessionId,
        pageNumber: page,
      });
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error("Tracking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
