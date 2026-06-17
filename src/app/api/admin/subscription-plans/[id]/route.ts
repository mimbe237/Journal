import { NextRequest, NextResponse } from "next/server";
import { UserRole, PlanTargetAudience } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  getPlanById,
  updatePlan,
  deletePlan,
  UpdatePlanInput
} from "@/modules/subscription-plans/subscriptionPlanService";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// GET: Récupérer un plan par ID
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const plan = await getPlanById(id);

    if (!plan) {
      return NextResponse.json({ error: "Plan introuvable" }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error(`GET /api/admin/subscription-plans/${(await context.params).id} error:`, error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

// PUT: Mettre à jour un plan
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    const { id } = await context.params;

    const body = await req.json();
    
    const input: UpdatePlanInput = {
      ...(body.nom !== undefined && { nom: body.nom }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.targetAudience !== undefined && { targetAudience: body.targetAudience as PlanTargetAudience }),
      ...(body.durationMonths !== undefined && { durationMonths: parseInt(body.durationMonths, 10) }),
      ...(body.basePrice !== undefined && { basePrice: parseFloat(body.basePrice) }),
      ...(body.currency !== undefined && { currency: body.currency }),
      // Champs entreprise
      ...(body.pricePerUser !== undefined && { pricePerUser: body.pricePerUser ? parseFloat(body.pricePerUser) : null }),
      ...(body.minUsers !== undefined && { minUsers: body.minUsers ? parseInt(body.minUsers, 10) : null }),
      ...(body.maxUsers !== undefined && { maxUsers: body.maxUsers ? parseInt(body.maxUsers, 10) : null }),
      // Affichage
      ...(body.advantages !== undefined && { advantages: body.advantages }),
      ...(body.highlight !== undefined && { highlight: body.highlight }),
      ...(body.badge !== undefined && { badge: body.badge }),
      ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      ...(body.journalTypeIds !== undefined && { journalTypeIds: body.journalTypeIds })
    };

    const plan = await updatePlan(id, input);
    return NextResponse.json(plan);
  } catch (error: any) {
    console.error(`PUT /api/admin/subscription-plans/${(await context.params).id} error:`, error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 400 });
  }
}

// DELETE: Supprimer/désactiver un plan
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    const { id } = await context.params;

    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "true";

    await deletePlan(id, hard);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`DELETE /api/admin/subscription-plans/${(await context.params).id} error:`, error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 400 });
  }
}
