import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import { fileStorageProvider } from "@/services/fileStorage";

// Route publique : sert une page de la dernière édition sous forme d'image pour la démo.
// Sécurité : vérifie que l'édition demandée est bien la dernière publiée (pas d'accès à d'autres éditions).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; page: string }> }
) {
  try {
    await prismaRuntimeReady;

    const { id, page } = await params;
    const editionId = id?.trim();
    if (!editionId) {
      return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    }

    // Vérifier que c'est bien la dernière édition (sécurité : empêche l'accès à n'importe quelle édition)
    const latestEdition = await prisma.edition.findFirst({
      where: { deletedAt: null },
      orderBy: { datePublication: "desc" },
    });

    if (!latestEdition || latestEdition.id !== editionId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: "Numéro de page invalide" }, { status: 400 });
    }
    if (latestEdition.nombrePages && pageNumber > latestEdition.nombrePages) {
      return NextResponse.json({ error: "Page hors limites" }, { status: 400 });
    }

    const editionFolder = path.dirname(latestEdition.cheminInternePdf);
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
    console.error("GET /api/demo/edition/[id]/pages/[page]/image failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
