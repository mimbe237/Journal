import { NextRequest, NextResponse } from "next/server";
import { UserRole, DiscountType } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { updatePromoCode } from "@/modules/promocodes/promoCodeService";

async function updatePromo(req: NextRequest, id: string) {
  await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const {
    code,
    typeRemise,
    valeurRemise,
    dateDebut,
    dateFin,
    nombreUtilisationsMax,
    actif
  } = body ?? {};

  const promo = await updatePromoCode({
    id,
    code,
    typeRemise: typeRemise as DiscountType | undefined,
    valeurRemise,
    dateDebut: dateDebut ? new Date(dateDebut) : undefined,
    dateFin: dateFin ? new Date(dateFin) : undefined,
    nombreUtilisationsMax,
    actif
  });

  return NextResponse.json({ promo }, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await updatePromo(req, id);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la mise à jour" }, { status: 400 });
  }
}

// Accepte PATCH pour activer/désactiver depuis l'UI
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await updatePromo(req, id);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la mise à jour" }, { status: 400 });
  }
}
