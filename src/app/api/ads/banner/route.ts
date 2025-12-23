import { NextRequest, NextResponse } from "next/server";
import { selectAdForEditionEmail } from "@/modules/advertising/adSelectionService";
import { recordImpression } from "@/modules/advertising/trackingService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

/**
 * GET /api/ads/banner
 * Retourne une bannière ciblée pour l'utilisateur connecté
 * Query params: emailSendId (optionnel), editionId (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ ad: null }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const emailSendId = searchParams.get("emailSendId") || undefined;

    const ad = await selectAdForEditionEmail(session.user.id, emailSendId);
    
    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 200 });
    }

    // Enregistrer l'impression
    await recordImpression({
      creativeId: ad.creativeId,
      campaignId: ad.campaignId,
      userId: session.user.id,
      emailSendId,
      channel: "EMAIL",
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ ad });
  } catch (error) {
    console.error("[API] GET /api/ads/banner error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
