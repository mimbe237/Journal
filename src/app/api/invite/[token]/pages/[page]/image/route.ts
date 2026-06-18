import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { getGuestEditionByToken } from "@/modules/guest-editions/guestEditionService";
import { fileStorageProvider } from "@/services/fileStorage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string; page: string }> }
) {
  try {

    const { token, page } = await params;

    const slot = await getGuestEditionByToken(token);

    if (!slot || !slot.edition) {
      // 403 intentionnel : ne pas confirmer l'existence ou non du token
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: "Numéro de page invalide" }, { status: 400 });
    }
    if (slot.edition.nombrePages && pageNumber > slot.edition.nombrePages) {
      return NextResponse.json({ error: "Page hors limites" }, { status: 400 });
    }

    // Même logique de chemin que /api/demo/edition/[id]/pages/[page]/image
    const editionFolder = path.dirname(slot.edition.cheminInternePdf);
    const baseImagePath = path.join(editionFolder, "images", `page-${pageNumber}`);
    const candidates = [
      { path: `${baseImagePath}.webp`, contentType: "image/webp" },
      { path: `${baseImagePath}.png`, contentType: "image/png" },
    ];

    let selected: { path: string; contentType: string } | null = null;
    for (const candidate of candidates) {
      const exists = await fileStorageProvider.fileExists({ path: candidate.path });
      if (exists) {
        selected = candidate;
        break;
      }
    }

    if (!selected) {
      return NextResponse.json({ error: "Image indisponible" }, { status: 404 });
    }

    const stream = await fileStorageProvider.getFileStream({ path: selected.path });
    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": selected.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("GET /api/invite/[token]/pages/[page]/image failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
