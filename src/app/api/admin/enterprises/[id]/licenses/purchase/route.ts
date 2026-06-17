import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { purchaseLicenses } from "@/modules/enterprises/licenseService";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/enterprises/[id]/licenses/purchase
 * 
 * Achète des licences pour une entreprise.
 * Rôles autorisés: SUPER_ADMIN, FACTURATION
 * 
 * Body:
 * {
 *   quantity: number,           // Nombre de licences à acheter (requis)
 *   prixUnitaire?: number,      // Prix par licence
 *   montantTotal?: number,      // Montant total payé
 *   devise?: string,            // Devise (défaut: XAF)
 *   paymentRef?: string,        // Référence facture/paiement
 *   reason?: string             // Raison de l'achat
 * }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN, 
      UserRole.FACTURATION
    ]);

    const { id: enterpriseId } = await context.params;
    const body = await req.json();

    // Validation
    const quantity = parseInt(body.quantity, 10);
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "La quantité doit être un nombre supérieur à 0" },
        { status: 400 }
      );
    }

    if (quantity > 1000) {
      return NextResponse.json(
        { error: "Quantité maximum: 1000 licences par transaction" },
        { status: 400 }
      );
    }

    const result = await purchaseLicenses({
      enterpriseId,
      quantity,
      prixUnitaire: body.prixUnitaire ? parseFloat(body.prixUnitaire) : undefined,
      montantTotal: body.montantTotal ? parseFloat(body.montantTotal) : undefined,
      devise: body.devise || "XAF",
      paymentRef: body.paymentRef?.trim() || undefined,
      reason: body.reason?.trim() || undefined,
      createdBy: currentUser.id
    });

    return NextResponse.json({
      success: true,
      message: `${quantity} licence(s) achetée(s) avec succès`,
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        delta: result.transaction.delta,
        createdAt: result.transaction.createdAt.toISOString()
      },
      newTotal: result.newTotal
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/enterprises/[id]/licenses/purchase error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" }, 
      { status: error.message?.includes("introuvable") ? 404 : 400 }
    );
  }
}
