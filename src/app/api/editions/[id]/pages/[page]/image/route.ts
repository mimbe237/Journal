import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { canUserAccessEdition } from "@/modules/enterprises/enterpriseService";
import { getEditionById } from "@/modules/editions/editionService";
import { fileStorageProvider } from "@/services/fileStorage";
import { recordReadingActivity } from "@/modules/editions/readingSessionService";
import { logSystemEvent } from "@/modules/logs/loggingService";
import { getClientIp, getUserAgent } from "@/lib/http/requestContext";

// Sert une page d'édition sous forme d'image WebP (fallback PNG). Ne révèle jamais le PDF source.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; page: string }> }
) {
  try {
    const { id, page } = await params;
    const editionId = id?.trim();
    if (!editionId) return NextResponse.json({ error: "Identifiant d'édition manquant" }, { status: 400 });

    const user = await getCurrentUserFromRequest(req);
    const ip = getClientIp(req);
    const userAgent = getUserAgent(req);

    if (!user) {
      await logSystemEvent({
        type: "TENTATIVE_ACCES_SANS_ABONNEMENT",
        ip,
        meta: { editionId, page, reason: "anonymous" }
      });
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const edition = await getEditionById(editionId);
    if (!edition) return NextResponse.json({ error: "Édition introuvable" }, { status: 404 });

    const canAccess = await canUserAccessEdition({ userId: user.id, editionId: edition.id });
    if (!canAccess) {
      await logSystemEvent({
        type: "TENTATIVE_ACCES_SANS_ABONNEMENT",
        userId: user.id,
        ip,
        meta: { editionId: edition.id, page }
      });
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: "Numéro de page invalide" }, { status: 400 });
    }
    if (edition.nombrePages && pageNumber > edition.nombrePages) {
      return NextResponse.json({ error: "Page hors limites" }, { status: 400 });
    }

    // Extraire le dossier de l'édition depuis le chemin du PDF
    // cheminInternePdf exemple: "editions/28d7d3c2-9210-4dce-9fe5-4933de29a61f/source.pdf"
    const editionFolder = path.dirname(edition.cheminInternePdf);
    const baseImagePath = path.join(editionFolder, "images", `page-${pageNumber}`);
    const candidates: { path: string; contentType: string }[] = [
      { path: `${baseImagePath}.webp`, contentType: "image/webp" },
      { path: `${baseImagePath}.png`, contentType: "image/png" }
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

    // Enregistrer l'activité de lecture (session regroupée sur 30 min glissantes).
    await recordReadingActivity({
      userId: user.id,
      editionId: edition.id,
      pageNumber,
      adresseIp: ip,
      userAgent
    });

    const stream = await fileStorageProvider.getFileStream({ path: selected.path });
    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": selected.contentType,
        "Cache-Control": "private, max-age=0, no-store"
      }
    });
  } catch (error: any) {
    console.error("GET /api/editions/[id]/pages/[page]/image failed", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de l'image" }, { status: 500 });
  }
}
