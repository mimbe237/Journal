import { NextRequest, NextResponse } from "next/server";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";
import { loadAdminDashboardStats } from "@/lib/admin/dashboardStats";

/**
 * GET /api/admin/dashboard/stats
 * Retourne les statistiques globales pour le tableau de bord admin
 */
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.FACTURATION,
      UserRole.SUPPORT
    ]);

    const stats = await loadAdminDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    // Log l'erreur complète pour déboguer
    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
