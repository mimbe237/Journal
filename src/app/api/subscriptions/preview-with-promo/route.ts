import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { calculateDiscountedAmount, validatePromoCode } from "@/modules/promocodes/promoCodeService";

// Prévisualisation d'une remise sans créer l'abonnement (front).
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.ABONNE,
      UserRole.COMPTE_ENTREPRISE,
      UserRole.UTILISATEUR_ENTREPRISE
    ]);

    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { montantInitial, promoCode } = body ?? {};

    if (typeof montantInitial !== "number" || montantInitial <= 0) {
      return NextResponse.json({ error: "montantInitial invalide" }, { status: 400 });
    }
    if (!promoCode || typeof promoCode !== "string") {
      return NextResponse.json({ error: "Code promo requis" }, { status: 400 });
    }

    const promo = await validatePromoCode({
      code: promoCode,
      dateUsage: new Date(),
      userId: user.id
    });

    const montantFinal = calculateDiscountedAmount({
      montantInitial,
      typeRemise: promo.typeRemise,
      valeurRemise: promo.valeurRemise.toNumber()
    });

    return NextResponse.json({
      montantInitial,
      montantFinal,
      detailsPromo: {
        code: promo.code,
        typeRemise: promo.typeRemise,
        valeurRemise: promo.valeurRemise
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la prévisualisation" }, { status: 400 });
  }
}
