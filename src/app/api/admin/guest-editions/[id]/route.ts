import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles, AuthorizationError } from "@/lib/auth/authorization";
import {
  getGuestEditionById,
  updateGuestEditionSlot,
} from "@/modules/guest-editions/guestEditionService";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const { id } = await params;

    const body = await req.json();
    const { editionId } = body as { editionId: string | null | undefined };

    if (editionId !== null && editionId !== undefined && typeof editionId !== "string") {
      return NextResponse.json({ error: "editionId doit être une chaîne ou null" }, { status: 400 });
    }
    if (typeof editionId === "string" && editionId.trim() === "") {
      return NextResponse.json({ error: "editionId ne peut pas être une chaîne vide" }, { status: 400 });
    }

    const slot = await getGuestEditionById(id);
    if (!slot) {
      return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
    }

    const updated = await updateGuestEditionSlot(id, editionId ?? null);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    return NextResponse.json({
      id: updated.id,
      dayOfWeek: updated.dayOfWeek,
      dayLabel: updated.dayLabel,
      editionId: updated.editionId,
      edition: updated.edition
        ? {
            id: updated.edition.id,
            titre: updated.edition.titre,
            datePublication: updated.edition.datePublication,
            type: updated.edition.type,
            nombrePages: updated.edition.nombrePages,
            cheminImageUne: updated.edition.cheminImageUne,
            deletedAt: updated.edition.deletedAt,
          }
        : null,
      publicToken: updated.publicToken,
      publicUrl: updated.editionId
        ? `${baseUrl}/lire/invite/${updated.publicToken}`
        : null,
      assignedAt: updated.assignedAt,
      isActive: updated.isActive,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error?.message === "Edition introuvable") {
      return NextResponse.json({ error: "Édition introuvable ou supprimée" }, { status: 404 });
    }
    console.error("PATCH /api/admin/guest-editions/[id] failed", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
