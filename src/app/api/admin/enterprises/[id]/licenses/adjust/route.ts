import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { adjustLicenses } from "@/modules/enterprises/licenseService";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/enterprises/[id]/licenses/adjust
 * 
 * Ajuste manuellement le nombre de licences (correction, geste commercial, remboursement).
 * Rôles autorisés: SUPER_ADMIN uniquement
 * 
 * Body:
 * {
 *   delta: number,    // Nombre de licences à ajouter/retirer (+ ou -)
 *   reason: string    // Raison de l'ajustement (obligatoire)
 * }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN
    ]);

    const { id: enterpriseId } = await context.params;
    const body = await req.json();

    // Validation
    const delta = parseInt(body.delta, 10);
    if (delta === 0 || isNaN(delta)) {
      return NextResponse.json(
        { error: "Le delta doit être un nombre non nul" },
        { status: 400 }
      );
    }

    if (Math.abs(delta) > 100) {
      return NextResponse.json(
        { error: "Ajustement maximum: ±100 licences par transaction" },
        { status: 400 }
      );
    }

    const reason = body.reason?.trim();
    if (!reason) {
      return NextResponse.json(
        { error: "Une raison est obligatoire pour un ajustement" },
        { status: 400 }
      );
    }

    if (reason.length < 10) {
      return NextResponse.json(
        { error: "La raison doit contenir au moins 10 caractères" },
        { status: 400 }
      );
    }

    const result = await adjustLicenses({
      enterpriseId,
      delta,
      reason,
      createdBy: currentUser.id
    });

    const action = delta > 0 ? "ajoutée(s)" : "retirée(s)";

    return NextResponse.json({
      success: true,
      message: `${Math.abs(delta)} licence(s) ${action} avec succès`,
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        delta: result.transaction.delta,
        reason: result.transaction.reason,
        createdAt: result.transaction.createdAt.toISOString()
      },
      newTotal: result.newTotal
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/enterprises/[id]/licenses/adjust error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" }, 
      { status: error.message?.includes("introuvable") ? 404 : 400 }
    );
  }
}
