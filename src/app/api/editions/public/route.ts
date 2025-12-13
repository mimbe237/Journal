import { NextRequest, NextResponse } from "next/server";

import { listEditions } from "@/modules/editions/editionService";

// Route publique pour afficher les éditions sur la page d'accueil
// Retourne uniquement les informations de base (pas de contenu protégé)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "12", 10);

    const result = await listEditions({ page, pageSize, order: "DESC" });
    
    // Retourner uniquement les infos publiques (pas les chemins internes)
    const publicData = result.data.map((edition) => ({
      id: edition.id,
      titre: edition.titre,
      datePublication: edition.datePublication,
      nombrePages: edition.nombrePages,
      type: edition.type,
      cheminImageUne: edition.cheminImageUne, // L'image de une peut être publique
    }));

    const response = NextResponse.json({
      data: publicData,
      total: result.total,
      page,
      pageSize,
    });
    
    // Cache publique pendant 5 minutes
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 500 });
  }
}
