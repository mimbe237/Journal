import { NextRequest, NextResponse } from "next/server";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";
import { listCurrencies, createCurrency } from "@/modules/currencies/currencyService";

export async function GET(req: NextRequest) {
  await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
  const currencies = await listCurrencies();
  return NextResponse.json(currencies);
}

export async function POST(req: NextRequest) {
  await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
  const body = await req.json();
  const code = (body.code as string)?.toUpperCase?.();
  const name = body.name as string;
  const rateToXaf = Number(body.rateToXaf);

  if (!code || !name || Number.isNaN(rateToXaf) || rateToXaf <= 0) {
    return NextResponse.json({ error: "Code, nom et taux valides requis" }, { status: 400 });
  }

  try {
    const currency = await createCurrency({ code, name, rateToXaf });
    return NextResponse.json(currency, { status: 201 });
  } catch (error: unknown) {
    console.error("Erreur création devise:", error);
    return NextResponse.json({ error: "Impossible de créer la devise" }, { status: 500 });
  }
}
