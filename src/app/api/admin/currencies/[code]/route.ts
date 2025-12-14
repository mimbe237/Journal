import { NextRequest, NextResponse } from "next/server";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";
import { updateCurrency } from "@/modules/currencies/currencyService";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
  const { code } = await params;
  const body = await req.json();
  const updates: { name?: string; rateToXaf?: number; isActive?: boolean } = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.rateToXaf !== undefined) updates.rateToXaf = Number(body.rateToXaf);
  if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

  if (updates.rateToXaf !== undefined && (Number.isNaN(updates.rateToXaf) || updates.rateToXaf <= 0)) {
    return NextResponse.json({ error: "Taux de conversion invalide" }, { status: 400 });
  }

  try {
    const currency = await updateCurrency(code, updates);
    return NextResponse.json(currency);
  } catch (error: unknown) {
    console.error("Erreur mise à jour devise:", error);
    return NextResponse.json({ error: "Impossible de mettre à jour la devise" }, { status: 500 });
  }
}
