import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { 
  getLicenseSummary, 
  getLicenseTransactions 
} from "@/modules/enterprises/licenseService";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/enterprises/[id]/licenses
 * 
 * Récupère le résumé des licences et l'historique des transactions.
 * Rôles autorisés: SUPER_ADMIN, FACTURATION, SUPPORT
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN, 
      UserRole.FACTURATION, 
      UserRole.SUPPORT
    ]);

    const { id: enterpriseId } = await context.params;
    const { searchParams } = new URL(req.url);
    
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const [summary, transactionsResult] = await Promise.all([
      getLicenseSummary(enterpriseId),
      getLicenseTransactions(enterpriseId, { limit, offset })
    ]);

    return NextResponse.json({
      summary,
      transactions: transactionsResult.transactions.map(t => ({
        id: t.id,
        type: t.type,
        delta: t.delta,
        reason: t.reason,
        paymentRef: t.paymentRef,
        prixUnitaire: t.prixUnitaire ? Number(t.prixUnitaire) : null,
        montantTotal: t.montantTotal ? Number(t.montantTotal) : null,
        devise: t.devise,
        createdAt: t.createdAt.toISOString(),
        createdBy: {
          id: t.creator.id,
          nom: t.creator.nom,
          email: t.creator.email
        }
      })),
      totalTransactions: transactionsResult.total,
      pagination: { limit, offset }
    });
  } catch (error: any) {
    console.error("GET /api/admin/enterprises/[id]/licenses error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" }, 
      { status: error.message?.includes("introuvable") ? 404 : 500 }
    );
  }
}
