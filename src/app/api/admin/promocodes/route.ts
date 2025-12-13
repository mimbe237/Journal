import { NextRequest, NextResponse } from "next/server";
import { UserRole, DiscountType } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { createPromoCode } from "@/modules/promocodes/promoCodeService";
import { prisma } from "@/lib/config/prisma";

// GET : liste paginée des codes promo (simple offset/limit).
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION]);
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get("take") ?? "20", 10), 100);
    const skip = parseInt(searchParams.get("skip") ?? "0", 10);

    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      take,
      skip
    });

    return NextResponse.json({ data: promos });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 400 });
  }
}

// POST : création d'un code promo.
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
    const body = await req.json();
    const {
      code,
      typeRemise,
      valeurRemise,
      dateDebut,
      dateFin,
      nombreUtilisationsMax,
      actif
    } = body ?? {};

    const promo = await createPromoCode({
      code,
      typeRemise: typeRemise as DiscountType,
      valeurRemise,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      nombreUtilisationsMax: nombreUtilisationsMax ?? null,
      actif
    });

    return NextResponse.json({ promo }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la création" }, { status: 400 });
  }
}
