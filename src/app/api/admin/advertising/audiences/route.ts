/**
 * API Admin - Segments d'audience
 * 
 * GET  /api/admin/advertising/audiences - Liste les segments
 * POST /api/admin/advertising/audiences - Crée un segment
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  listSegments,
  createSegment,
  CreateSegmentInput,
  AudienceFilters,
} from "@/modules/advertising/audienceService";

export const dynamic = "force-dynamic";

/**
 * GET: Liste des segments d'audience
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const segments = await listSegments(activeOnly);

    return NextResponse.json(segments);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/audiences error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST: Création d'un segment d'audience
 */
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const body = await req.json();

    // Validation
    if (!body.nom) {
      return NextResponse.json(
        { error: "Le nom du segment est requis." },
        { status: 400 }
      );
    }

    if (!body.filters || Object.keys(body.filters).length === 0) {
      return NextResponse.json(
        { error: "Au moins un critère de filtrage est requis." },
        { status: 400 }
      );
    }

    const input: CreateSegmentInput = {
      nom: body.nom,
      description: body.description,
      filters: body.filters as AudienceFilters,
    };

    const segment = await createSegment(input);

    return NextResponse.json(segment, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("POST /api/admin/advertising/audiences error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
