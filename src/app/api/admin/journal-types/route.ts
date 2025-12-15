/**
 * API Admin pour la gestion des types de journaux.
 * GET /api/admin/journal-types - Liste tous les types (actifs et inactifs).
 * POST /api/admin/journal-types - Crée un nouveau type de journal.
 * 
 * Accessible uniquement aux SUPER_ADMIN.
 */

import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError, requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";
import { 
  listJournalTypes, 
  createJournalType,
  JournalTypeInput 
} from "@/modules/journal-types/journalTypeService";

export async function GET(request: NextRequest) {
  try {
    await requireUserWithRoles(request, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
    
    const journalTypes = await listJournalTypes(true);
    return NextResponse.json(journalTypes);
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 403 });
    }
    if (error instanceof Error) {
      if (error.message === "Non authentifié" || error.message === "Accès refusé") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Erreur lors de la récupération des types de journaux:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des types de journaux" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireUserWithRoles(request, undefined, [UserRole.SUPER_ADMIN]);
    
    const body = await request.json();
    
    // Validation basique
    const requiredFields = ["name", "frequency", "unitPrice", "monthlyPrice", "sixMonthPrice", "yearlyPrice"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return NextResponse.json(
          { error: "Le champ " + field + " est requis" },
          { status: 400 }
        );
      }
    }
    
    const input: JournalTypeInput = {
      name: body.name,
      frequency: body.frequency,
      unitPrice: Number(body.unitPrice),
      monthlyPrice: Number(body.monthlyPrice),
      sixMonthPrice: Number(body.sixMonthPrice),
      yearlyPrice: Number(body.yearlyPrice),
      isActive: body.isActive ?? true
    };
    
    const journalType = await createJournalType(input);
    return NextResponse.json(journalType, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 403 });
    }
    if (error instanceof Error) {
      if (error.message === "Non authentifié" || error.message === "Accès refusé") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      // Gestion erreur de nom unique
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Un type de journal avec ce nom existe déjà" },
          { status: 400 }
        );
      }
    }
    console.error("Erreur lors de la création du type de journal:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du type de journal" },
      { status: 500 }
    );
  }
}
