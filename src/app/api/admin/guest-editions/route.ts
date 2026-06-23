import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles, AuthorizationError } from "@/lib/auth/authorization";
import {
  getAllGuestEditions,
  createGuestEditionSlot,
} from "@/modules/guest-editions/guestEditionService";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const slots = await getAllGuestEditions();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    const result = slots.map((slot) => ({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      dayLabel: slot.dayLabel,
      editionId: slot.editionId,
      edition: slot.edition
        ? {
            id: slot.edition.id,
            titre: slot.edition.titre,
            datePublication: slot.edition.datePublication,
            type: slot.edition.type,
            nombrePages: slot.edition.nombrePages,
            cheminImageUne: slot.edition.cheminImageUne,
            deletedAt: slot.edition.deletedAt,
          }
        : null,
      publicToken: slot.publicToken,
      publicUrl: slot.editionId ? `${baseUrl}/lire/invite/${slot.publicToken}` : null,
      assignedAt: slot.assignedAt,
      isActive: slot.isActive,
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("GET /api/admin/guest-editions failed", error?.message ?? error);
    return NextResponse.json({ error: `Erreur serveur : ${error?.message ?? String(error)}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);
    const slot = await createGuestEditionSlot();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.json({
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      dayLabel: slot.dayLabel,
      editionId: slot.editionId,
      edition: null,
      publicToken: slot.publicToken,
      publicUrl: null,
      assignedAt: slot.assignedAt,
      isActive: slot.isActive,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
