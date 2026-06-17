import { NextRequest, NextResponse } from "next/server";
import { UserRole, PlanTargetAudience } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  listAllPlans,
  listPublicPlans,
  createPlan,
  CreatePlanInput
} from "@/modules/subscription-plans/subscriptionPlanService";

export const dynamic = "force-dynamic";

// GET: Liste des plans (publics pour tous, tous pour admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminView = searchParams.get("admin") === "true";

    if (adminView) {
      await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
      const plans = await listAllPlans();
      return NextResponse.json(plans);
    }

    // Vue publique
    const plans = await listPublicPlans();
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("GET /api/admin/subscription-plans error:", error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status });
  }
}

// POST: Création d'un nouveau plan (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);

    const body = await req.json();
    
    // Validation de base
    if (!body.nom || !body.durationMonths || body.basePrice === undefined) {
      return NextResponse.json(
        { error: "Nom, durée et prix de base sont requis." },
        { status: 400 }
      );
    }

    if (!body.journalTypeIds || body.journalTypeIds.length === 0) {
      return NextResponse.json(
        { error: "Sélectionnez au moins un type de journal." },
        { status: 400 }
      );
    }

    // Validation pour plans entreprise
    const targetAudience = body.targetAudience || "INDIVIDUAL";
    if (targetAudience === "ENTERPRISE") {
      if (!body.minUsers || body.minUsers < 1) {
        return NextResponse.json(
          { error: "Le nombre minimum d'utilisateurs est requis pour un plan entreprise." },
          { status: 400 }
        );
      }
      if (body.pricePerUser === undefined || body.pricePerUser === null) {
        return NextResponse.json(
          { error: "Le prix par utilisateur est requis pour un plan entreprise." },
          { status: 400 }
        );
      }
    }

    const input: CreatePlanInput = {
      nom: body.nom,
      slug: body.slug || "",
      description: body.description,
      targetAudience: targetAudience as PlanTargetAudience,
      durationMonths: parseInt(body.durationMonths, 10),
      basePrice: parseFloat(body.basePrice),
      currency: body.currency || "XAF",
      // Champs entreprise
      pricePerUser: body.pricePerUser ? parseFloat(body.pricePerUser) : null,
      minUsers: body.minUsers ? parseInt(body.minUsers, 10) : null,
      maxUsers: body.maxUsers ? parseInt(body.maxUsers, 10) : null,
      // Affichage
      advantages: body.advantages || [],
      highlight: body.highlight || false,
      badge: body.badge || null,
      displayOrder: body.displayOrder || 0,
      isActive: body.isActive ?? true,
      isPublic: body.isPublic ?? true,
      journalTypeIds: body.journalTypeIds
    };

    const plan = await createPlan(input);
    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/subscription-plans error:", error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status });
  }
}
