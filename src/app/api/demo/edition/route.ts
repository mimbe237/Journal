import { NextResponse } from "next/server";
import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";

export const dynamic = "force-dynamic";

// Route publique : retourne la dernière édition publiée pour la page démo (sans authentification).
export async function GET() {
  try {
    await prismaRuntimeReady;

    const edition = await prisma.edition.findFirst({
      where: { deletedAt: null },
      orderBy: { datePublication: "desc" },
    });

    if (!edition) {
      return NextResponse.json({ error: "Aucune édition disponible" }, { status: 404 });
    }

    return NextResponse.json({
      edition: {
        id: edition.id,
        titre: edition.titre,
        datePublication: edition.datePublication,
        type: edition.type,
        nombrePages: edition.nombrePages,
      },
    });
  } catch (error: any) {
    console.error("GET /api/demo/edition failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
