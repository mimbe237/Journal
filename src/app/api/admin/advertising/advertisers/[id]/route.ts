/**
 * API Admin - Annonceur individuel
 * 
 * GET    /api/admin/advertising/advertisers/[id] - Détails d'un annonceur
 * PATCH  /api/admin/advertising/advertisers/[id] - Mise à jour
 * DELETE /api/admin/advertising/advertisers/[id] - Suppression
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  getAdvertiserById,
  updateAdvertiser,
  deleteAdvertiser,
  deactivateAdvertiser,
} from "@/modules/advertising/advertiserService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET: Détails d'un annonceur
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const advertiser = await getAdvertiserById(id);

    if (!advertiser) {
      return NextResponse.json(
        { error: "Annonceur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(advertiser);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/advertisers/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * PATCH: Mise à jour d'un annonceur
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const body = await req.json();

    const advertiser = await updateAdvertiser(id, {
      nom: body.nom,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      entreprise: body.entreprise,
      logoUrl: body.logoUrl,
      notes: body.notes,
      isActive: body.isActive,
    });

    return NextResponse.json(advertiser);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("PATCH /api/admin/advertising/advertisers/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE: Suppression (ou désactivation) d'un annonceur
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

    if (hard) {
      await deleteAdvertiser(id);
      return NextResponse.json({ message: "Annonceur supprimé définitivement" });
    } else {
      await deactivateAdvertiser(id);
      return NextResponse.json({ message: "Annonceur désactivé" });
    }
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("DELETE /api/admin/advertising/advertisers/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
