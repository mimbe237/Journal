import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/config/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { canUserAccessEdition } from "@/modules/enterprises/enterpriseService";
import { getEditionById } from "@/modules/editions/editionService";

// Métadonnées d'une édition (protégées : nécessite un utilisateur connecté avec droit d'accès).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const editionId = id?.trim();
    if (!editionId) return NextResponse.json({ error: "Identifiant d'édition manquant" }, { status: 400 });

    const edition = await getEditionById(editionId);
    if (!edition) return NextResponse.json({ error: "Édition introuvable" }, { status: 404 });

    const canAccess = await canUserAccessEdition({ userId: user.id, editionId: edition.id });
    if (!canAccess) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    // Récupérer le nom du journal type pour la détection de variante dans le lecteur
    let journalTypeName: string | null = null;
    if (edition.journalTypeId) {
      const journalType = await prisma.journalType.findUnique({
        where: { id: edition.journalTypeId },
        select: { name: true }
      });
      journalTypeName = journalType?.name ?? null;
    }

    return NextResponse.json({
      edition: {
        id: edition.id,
        titre: edition.titre,
        datePublication: edition.datePublication,
        type: edition.type,
        nombrePages: edition.nombrePages,
        createdAt: edition.createdAt,
        journalTypeName
      }
    });
  } catch (error: any) {
    console.error("GET /api/editions/[id] failed", error);
    return NextResponse.json({ error: "Erreur lors de la récupération de l'édition" }, { status: 500 });
  }
}
