import { NextRequest, NextResponse } from "next/server";
import { selectAdForEditionEmail } from "@/modules/advertising/adSelectionService";
import { recordImpression } from "@/modules/advertising/trackingService";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { AdChannel } from "@prisma/client";

/**
 * GET /api/ads/banner
 * Retourne une bannière ciblée pour l'utilisateur connecté
 * Query params: emailSendId (optionnel), editionId (optionnel)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user?.id) {
      return NextResponse.json({ ad: null }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const emailSendId = searchParams.get("emailSendId") || undefined;

    const ad = await selectAdForEditionEmail(user.id, emailSendId);
    
    if (!ad) {
      return NextResponse.json({ ad: null }, { status: 200 });
    }

    // Enregistrer l'impression
    await recordImpression({
      creativeId: ad.creativeId,
      campaignId: ad.campaignId,
      userId: user.id,
      emailSendId,
      channel: AdChannel.EMAIL_EDITION,
    });

    return NextResponse.json({ ad });
  } catch (error) {
    console.error("[API] GET /api/ads/banner error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
