/**
 * API Admin - Segment d'audience individuel
 * 
 * GET    /api/admin/advertising/audiences/[id] - Détails d'un segment
 * PATCH  /api/admin/advertising/audiences/[id] - Mise à jour
 * DELETE /api/admin/advertising/audiences/[id] - Suppression
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  getSegmentById,
  updateSegment,
  deleteSegment,
  refreshSegmentReach,
  AudienceFilters,
} from "@/modules/advertising/audienceService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET: Détails d'un segment
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const segment = await getSegmentById(id);

    if (!segment) {
      return NextResponse.json(
        { error: "Segment non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(segment);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/audiences/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * PATCH: Mise à jour d'un segment
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const body = await req.json();

    // Action spéciale: rafraîchir le reach
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "refresh") {
      await refreshSegmentReach(id);
      const segment = await getSegmentById(id);
      return NextResponse.json(segment);
    }

    const segment = await updateSegment(id, {
      nom: body.nom,
      description: body.description,
      filters: body.filters as AudienceFilters | undefined,
      isActive: body.isActive,
    });

    return NextResponse.json(segment);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("PATCH /api/admin/advertising/audiences/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE: Suppression d'un segment
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);

    const { id } = await params;
    await deleteSegment(id);

    return NextResponse.json({ message: "Segment supprimé" });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("DELETE /api/admin/advertising/audiences/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
