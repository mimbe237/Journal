/**
 * API Admin - Campagne individuelle
 * 
 * GET    /api/admin/advertising/campaigns/[id] - Détails d'une campagne
 * PATCH  /api/admin/advertising/campaigns/[id] - Mise à jour
 * DELETE /api/admin/advertising/campaigns/[id] - Suppression
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole, AdCampaignStatus, AdChannel } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  activateCampaign,
  pauseCampaign,
  cancelCampaign,
} from "@/modules/advertising/campaignService";
import { getCampaignReport } from "@/modules/advertising/reportingService";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET: Détails d'une campagne (avec option rapport)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const withReport = searchParams.get("report") === "true";

    if (withReport) {
      const report = await getCampaignReport(id);
      if (!report) {
        return NextResponse.json(
          { error: "Campagne non trouvée" },
          { status: 404 }
        );
      }
      return NextResponse.json(report);
    }

    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { error: "Campagne non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/campaigns/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * PATCH: Mise à jour d'une campagne
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.COMMERCIAL,
    ]);

    const { id } = await params;
    const body = await req.json();

    // Actions spéciales via query param
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action) {
      let result;
      switch (action) {
        case "activate":
          result = await activateCampaign(id);
          break;
        case "pause":
          result = await pauseCampaign(id);
          break;
        case "cancel":
          result = await cancelCampaign(id);
          break;
        default:
          return NextResponse.json(
            { error: `Action inconnue: ${action}` },
            { status: 400 }
          );
      }
      return NextResponse.json(result);
    }

    // Mise à jour standard
    const campaign = await updateCampaign(id, {
      nom: body.nom,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      budget: body.budget ? parseFloat(body.budget) : undefined,
      currency: body.currency,
      priority: body.priority !== undefined ? parseInt(body.priority, 10) : undefined,
      channels: body.channels as AdChannel[] | undefined,
      isExclusive: body.isExclusive,
      dailyCap: body.dailyCap !== undefined ? parseInt(body.dailyCap, 10) : undefined,
      totalCap: body.totalCap !== undefined ? parseInt(body.totalCap, 10) : undefined,
      segmentIds: body.segmentIds,
      status: body.status as AdCampaignStatus | undefined,
    });

    return NextResponse.json(campaign);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("PATCH /api/admin/advertising/campaigns/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}

/**
 * DELETE: Suppression d'une campagne
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);

    const { id } = await params;
    await deleteCampaign(id);

    return NextResponse.json({ message: "Campagne supprimée" });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("DELETE /api/admin/advertising/campaigns/[id] error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
