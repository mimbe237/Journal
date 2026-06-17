import { NextRequest, NextResponse } from "next/server";

import { prismaRuntimeReady } from "@/lib/config/prisma";
import { getGuestEditionByToken } from "@/modules/guest-editions/guestEditionService";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await prismaRuntimeReady;

    const { token } = await params;

    const slot = await getGuestEditionByToken(token);

    if (!slot || !slot.edition) {
      return NextResponse.json(
        { error: "Lien invalide ou aucune édition configurée pour ce créneau" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        edition: {
          id: slot.edition.id,
          titre: slot.edition.titre,
          datePublication: slot.edition.datePublication,
          type: slot.edition.type,
          nombrePages: slot.edition.nombrePages,
        },
        guestInfo: {
          dayLabel: slot.dayLabel,
          isGuestAccess: true,
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: any) {
    console.error("GET /api/invite/[token] failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
