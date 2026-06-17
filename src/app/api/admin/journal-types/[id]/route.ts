/**
 * API Admin pour un type de journal spécifique.
 * GET /api/admin/journal-types/[id] - Récupère un type.
 * PUT /api/admin/journal-types/[id] - Met à jour un type.
 * DELETE /api/admin/journal-types/[id] - Supprime un type.
 * 
 * Accessible uniquement aux SUPER_ADMIN.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";
import { 
  getJournalTypeById,
  updateJournalType,
  deleteJournalType,
  toggleJournalTypeStatus,
  JournalTypeInput 
} from "@/modules/journal-types/journalTypeService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(request, undefined, [UserRole.SUPER_ADMIN]);
    
    const { id } = await params;
    const journalType = await getJournalTypeById(id);
    
    if (!journalType) {
      return NextResponse.json(
        { error: "Type de journal non trouvé" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(journalType);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Non authentifié" || error.message === "Accès refusé") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error("Erreur lors de la récupération du type de journal:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(request, undefined, [UserRole.SUPER_ADMIN]);
    
    const { id } = await params;
    const body = await request.json();
    
    // Si c'est juste un toggle de statut
    if (body.toggleStatus === true) {
      const journalType = await toggleJournalTypeStatus(id);
      return NextResponse.json(journalType);
    }
    
    // Sinon mise à jour complète
    const input: Partial<JournalTypeInput> = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.frequency !== undefined) input.frequency = body.frequency;
    if (body.unitPrice !== undefined) input.unitPrice = Number(body.unitPrice);
    if (body.titleTemplate !== undefined) input.titleTemplate = body.titleTemplate;
    if (body.isActive !== undefined) input.isActive = body.isActive;
    
    const journalType = await updateJournalType(id, input);
    return NextResponse.json(journalType);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Non authentifié" || error.message === "Accès refusé") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message === "Type de journal non trouvé") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Un type de journal avec ce nom existe déjà" },
          { status: 400 }
        );
      }
    }
    console.error("Erreur lors de la mise à jour du type de journal:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(request, undefined, [UserRole.SUPER_ADMIN]);
    
    const { id } = await params;
    
    await deleteJournalType(id);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Non authentifié" || error.message === "Accès refusé") {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (error.message.includes("éditions y sont associées")) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    console.error("Erreur lors de la suppression du type de journal:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
