/**
 * API publique pour récupérer les types de journaux actifs.
 * GET /api/journal-types - Liste les types actifs avec leur grille tarifaire.
 */

import { NextResponse } from "next/server";
import { getActiveJournalTypesWithPricing } from "@/modules/journal-types/journalTypeService";

export async function GET() {
  try {
    const journalTypes = await getActiveJournalTypesWithPricing();
    return NextResponse.json(journalTypes);
  } catch (error) {
    console.error("Erreur lors de la récupération des types de journaux:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de journaux" },
      { status: 500 }
    );
  }
}
