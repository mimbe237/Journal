/**
 * API Admin - Campagnes publicitaires
 * 
 * GET  /api/admin/advertising/campaigns - Liste les campagnes
 * POST /api/admin/advertising/campaigns - Crée une campagne
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole, AdCampaignStatus, AdChannel } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  listCampaigns,
  createCampaign,
  CreateCampaignInput,
} from "@/modules/advertising/campaignService";

export const dynamic = "force-dynamic";

/**
 * GET: Liste des campagnes
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as AdCampaignStatus | null;
    const advertiserId = searchParams.get("advertiserId");
    const channel = searchParams.get("channel") as AdChannel | null;

    const campaigns = await listCampaigns({
      status: status || undefined,
      advertiserId: advertiserId || undefined,
      channel: channel || undefined,
    });

    return NextResponse.json(campaigns);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/campaigns error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * POST: Création d'une campagne
 */
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const body = await req.json();

    // Validation
    if (!body.nom || !body.advertiserId || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "Nom, annonceur, date de début et date de fin sont requis." },
        { status: 400 }
      );
    }

    if (!body.channels || body.channels.length === 0) {
      return NextResponse.json(
        { error: "Sélectionnez au moins un canal de diffusion." },
        { status: 400 }
      );
    }

    const input: CreateCampaignInput = {
      nom: body.nom,
      advertiserId: body.advertiserId,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      budget: body.budget ? parseFloat(body.budget) : undefined,
      currency: body.currency || "XAF",
      priority: body.priority ? parseInt(body.priority, 10) : 0,
      channels: body.channels as AdChannel[],
      isExclusive: body.isExclusive || false,
      dailyCap: body.dailyCap ? parseInt(body.dailyCap, 10) : undefined,
      totalCap: body.totalCap ? parseInt(body.totalCap, 10) : undefined,
      segmentIds: body.segmentIds || [],
    };

    const campaign = await createCampaign(input);

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("POST /api/admin/advertising/campaigns error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
