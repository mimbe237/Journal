/**
 * API Admin - Statistiques publicitaires globales
 * 
 * GET /api/admin/advertising/stats - Statistiques globales du système pub
 */

import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getGlobalAdStats } from "@/modules/advertising/reportingService";

export const dynamic = "force-dynamic";

/**
 * GET: Statistiques globales
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT,
      UserRole.COMMERCIAL,
    ]);

    const stats = await getGlobalAdStats();

    return NextResponse.json(stats);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    console.error("GET /api/admin/advertising/stats error:", error);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.status || 500 }
    );
  }
}
