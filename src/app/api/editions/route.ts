import { NextRequest, NextResponse } from "next/server";
import { EditionType } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { listEditions } from "@/modules/editions/editionService";

// Cache les résultats pendant 60 secondes (éditions changent rarement)
export const revalidate = 60;

// Liste des éditions pour le kiosque.
// TODO: décider si l'accès nécessite un abonnement actif ou seulement une connexion.
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") ?? "12", 10);
    const type = (searchParams.get("type") as EditionType | null) ?? undefined;
    const order = (searchParams.get("order") as "ASC" | "DESC" | null) ?? "DESC";

    const result = await listEditions({ page, pageSize, type, order });
    
    // Ajouter headers de cache
    const response = NextResponse.json(result);
    response.headers.set("Cache-Control", "private, max-age=60, s-maxage=60");
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 400 });
  }
}
