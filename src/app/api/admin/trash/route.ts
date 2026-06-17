import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  listTrashItems,
  purgeExpiredTrashItems,
} from "@/modules/trash/trashService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/trash
 * Liste tous les éléments dans la corbeille.
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    
    const items = await listTrashItems();
    
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("GET /api/admin/trash error:", error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status });
  }
}

/**
 * POST /api/admin/trash/purge
 * Purge les éléments expirés (pour cron job).
 */
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    
    const result = await purgeExpiredTrashItems();
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/admin/trash error:", error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status });
  }
}
