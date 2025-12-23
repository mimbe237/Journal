/**
 * API Admin - Créatif individuel
 * 
 * GET    /api/admin/advertising/creatives/[id] - Détails d'un créatif
 * PATCH  /api/admin/advertising/creatives/[id] - Mise à jour
 * DELETE /api/admin/advertising/creatives/[id] - Suppression
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  getCreativeById,
  updateCreative,
  deleteCreative,
  toggleCreativeActive,
} from "@/modules/advertising/creativeService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET: Détails d'un créatif
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const creative = await getCreativeById(id);

    if (!creative) {
      return NextResponse.json(
        { error: "Créatif non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(creative);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/creatives/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * PATCH: Mise à jour d'un créatif
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const body = await req.json();

    // Action spéciale: toggle actif
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "toggle") {
      const creative = await toggleCreativeActive(id, body.isActive ?? true);
      return NextResponse.json(creative);
    }

    const creative = await updateCreative(id, {
      nom: body.nom,
      imageUrl: body.imageUrl,
      clickUrl: body.clickUrl,
      altText: body.altText,
      mjmlSnippet: body.mjmlSnippet,
      htmlSnippet: body.htmlSnippet,
      width: body.width ? parseInt(body.width, 10) : undefined,
      height: body.height ? parseInt(body.height, 10) : undefined,
      isActive: body.isActive,
    });

    return NextResponse.json(creative);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("PATCH /api/admin/advertising/creatives/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE: Suppression d'un créatif
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);

    const { id } = await params;
    await deleteCreative(id);

    return NextResponse.json({ message: "Créatif supprimé" });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("DELETE /api/admin/advertising/creatives/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
