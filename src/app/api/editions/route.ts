import { NextRequest, NextResponse } from "next/server";
import { EditionType } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { listEditions } from "@/modules/editions/editionService";
import { getEditionAccessForUser } from "@/modules/editions/editionAccessService";

// Forcer la route en mode dynamique pour autoriser l'usage des cookies (auth).
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    const query = searchParams.get("query") ?? undefined;

    const result = await listEditions({ page, pageSize, type, order, query });

    // Calculer l'accès par édition pour l'utilisateur courant
    const dataWithAccess = await Promise.all(
      result.data.map(async (edition) => {
        const access = await getEditionAccessForUser({
          userId: user.id,
          editionDate: edition.datePublication,
          journalTypeId: edition.journalTypeId
        });
        return {
          id: edition.id,
          titre: edition.titre,
          datePublication: edition.datePublication,
          type: edition.type,
          nombrePages: edition.nombrePages,
          cheminImageUne: edition.cheminImageUne,
          prix: edition.prix,
          devise: edition.devise,
          journalTypeId: edition.journalTypeId,
          access: {
            status: access.status,
            detail: access.detail,
            coverage: access.coverage
              ? {
                  ...access.coverage,
                  dateDebut: access.coverage.dateDebut.toISOString(),
                  dateFin: access.coverage.dateFin.toISOString(),
                }
              : null,
          },
        };
      })
    );

    // Ajouter headers de cache
    const response = NextResponse.json({
      data: dataWithAccess,
      total: result.total,
      page,
      pageSize,
    });
    response.headers.set("Cache-Control", "private, max-age=60, s-maxage=60");
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 400 });
  }
}
