import { NextRequest, NextResponse } from "next/server";
import { PlanTargetAudience } from "@prisma/client";
import { listPublicPlans, calculatePlanPrice } from "@/modules/subscription-plans/subscriptionPlanService";

export const dynamic = "force-dynamic";

// GET: Liste des plans publics (sans authentification)
// Query params: 
//   - audience: "INDIVIDUAL" | "ENTERPRISE" (optionnel)
//   - users: number (pour calcul du prix entreprise, optionnel)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audienceParam = searchParams.get("audience");
    const usersParam = searchParams.get("users");
    
    // Valider le paramètre audience
    let audience: PlanTargetAudience | undefined;
    if (audienceParam) {
      if (audienceParam === "INDIVIDUAL" || audienceParam === "ENTERPRISE") {
        audience = audienceParam as PlanTargetAudience;
      }
    }

    const numberOfUsers = usersParam ? parseInt(usersParam, 10) : 1;
    
    const plans = await listPublicPlans(audience);
    
    // Formater pour l'affichage public
    const formattedPlans = plans.map((plan) => {
      const priceDetails = calculatePlanPrice(plan, numberOfUsers);
      
      return {
        id: plan.id,
        nom: plan.nom,
        slug: plan.slug,
        description: plan.description,
        targetAudience: plan.targetAudience,
        durationMonths: plan.durationMonths,
        // Prix
        basePrice: Number(plan.basePrice),
        pricePerUser: plan.pricePerUser ? Number(plan.pricePerUser) : null,
        calculatedPrice: priceDetails.total,
        // Limites utilisateurs (entreprise)
        minUsers: plan.minUsers,
        maxUsers: plan.maxUsers,
        // Affichage
        currency: plan.currency,
        advantages: plan.advantages,
        highlight: plan.highlight,
        badge: plan.badge,
        journalTypes: plan.journalTypes.map((jt) => ({
          id: jt.journalType.id,
          name: jt.journalType.name
        }))
      };
    });

    return NextResponse.json(formattedPlans);
  } catch (error: any) {
    console.error("GET /api/subscription-plans error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
