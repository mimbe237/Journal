/**
 * API Publique - Enregistrement de clic publicitaire
 * 
 * POST /api/ads/click - Enregistre un clic sur une bannière
 */

import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { recordInAppClick, recordEmailAdClick } from "@/modules/advertising/trackingService";
import { AdChannel } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * POST: Enregistre un clic publicitaire
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { campaignId, creativeId, channel, emailSendId } = body;

    if (!campaignId || !creativeId) {
      return NextResponse.json(
        { error: "campaignId et creativeId sont requis" },
        { status: 400 }
      );
    }

    const user = await getCurrentUserFromRequest(req);
    const userId = user?.id;

    // Déterminer le canal
    const adChannel = channel === "email" 
      ? AdChannel.EMAIL_EDITION 
      : AdChannel.IN_APP_BANNER;

    if (adChannel === AdChannel.EMAIL_EDITION) {
      await recordEmailAdClick(campaignId, creativeId, userId || "", emailSendId);
    } else {
      await recordInAppClick(campaignId, creativeId, userId || "");
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("POST /api/ads/click error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du clic" },
      { status: 500 }
    );
  }
}
