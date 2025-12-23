/**
 * API Admin - Créatifs publicitaires
 * 
 * GET  /api/admin/advertising/creatives         - Liste les créatifs (par campagne)
 * POST /api/admin/advertising/creatives         - Crée un créatif
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  listCreativesByCampaign,
  createCreative,
  CreateCreativeInput,
  generateDefaultMjmlSnippet,
  generateDefaultHtmlSnippet,
} from "@/modules/advertising/creativeService";

export const dynamic = "force-dynamic";

/**
 * GET: Liste des créatifs d'une campagne
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "Le paramètre campaignId est requis." },
        { status: 400 }
      );
    }

    const creatives = await listCreativesByCampaign(campaignId);

    return NextResponse.json(creatives);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/creatives error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST: Création d'un créatif
 */
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const body = await req.json();

    // Validation
    if (!body.campaignId || !body.nom || !body.imageUrl || !body.clickUrl) {
      return NextResponse.json(
        { error: "Campagne, nom, URL image et URL clic sont requis." },
        { status: 400 }
      );
    }

    // Générer les snippets par défaut si non fournis
    const mjmlSnippet = body.mjmlSnippet || 
      generateDefaultMjmlSnippet(body.imageUrl, body.clickUrl, body.altText);
    const htmlSnippet = body.htmlSnippet || 
      generateDefaultHtmlSnippet(body.imageUrl, body.clickUrl, body.altText);

    const input: CreateCreativeInput = {
      campaignId: body.campaignId,
      nom: body.nom,
      imageUrl: body.imageUrl,
      clickUrl: body.clickUrl,
      altText: body.altText,
      mjmlSnippet,
      htmlSnippet,
      width: body.width ? parseInt(body.width, 10) : undefined,
      height: body.height ? parseInt(body.height, 10) : undefined,
    };

    const creative = await createCreative(input);

    return NextResponse.json(creative, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("POST /api/admin/advertising/creatives error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
