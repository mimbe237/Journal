/**
 * API Admin - Annonceurs
 * 
 * GET  /api/admin/advertising/advertisers         - Liste les annonceurs
 * POST /api/admin/advertising/advertisers         - Crée un annonceur
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  listAdvertisers,
  createAdvertiser,
  CreateAdvertiserInput,
} from "@/modules/advertising/advertiserService";

export const dynamic = "force-dynamic";

/**
 * GET: Liste des annonceurs
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("active");
    const search = searchParams.get("search");

    const advertisers = await listAdvertisers({
      isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
      search: search || undefined,
    });

    return NextResponse.json(advertisers);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/advertisers error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST: Création d'un annonceur
 */
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const body = await req.json();

    // Validation
    if (!body.nom || !body.contactEmail) {
      return NextResponse.json(
        { error: "Le nom et l'email de contact sont requis." },
        { status: 400 }
      );
    }

    const input: CreateAdvertiserInput = {
      nom: body.nom,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      entreprise: body.entreprise,
      logoUrl: body.logoUrl,
      notes: body.notes,
    };

    const advertiser = await createAdvertiser(input);

    return NextResponse.json(advertiser, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("POST /api/admin/advertising/advertisers error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
