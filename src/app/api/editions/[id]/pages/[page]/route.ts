import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "path";
import { getEditionById } from "@/modules/editions/editionService";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { canUserAccessEdition } from "@/modules/enterprises/enterpriseService";
import { fileStorageProvider } from "@/services/fileStorage";

// Sert une page d'édition sous forme d'image, uniquement si l'utilisateur a accès.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; page: string }> }
) {
  try {
    const { id, page } = await params;
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const editionId = id?.trim();
    if (!editionId) return NextResponse.json({ error: "Identifiant d'édition manquant" }, { status: 400 });

    const edition = await getEditionById(editionId);
    if (!edition) return NextResponse.json({ error: "Édition introuvable" }, { status: 404 });

    const canAccess = await canUserAccessEdition({ userId: user.id, editionId: edition.id });
    if (!canAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: "Numéro de page invalide" }, { status: 400 });
    }
    if (edition.nombrePages && pageNumber > edition.nombrePages) {
      return NextResponse.json({ error: "Page hors limites" }, { status: 400 });
    }

    const baseImagePath = path.join("editions", edition.id, "images", `page-${pageNumber}`);
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

    const stream = await fileStorageProvider.getFileStream({ path: selected.path });
    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": selected.contentType,
        "Cache-Control": "private, max-age=0, no-store"
      }
    });
  } catch (error: any) {
    console.error("GET /api/editions/[id]/pages/[page] failed", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de la page" }, { status: 500 });
  }
}
