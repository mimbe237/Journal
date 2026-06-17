import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { UserRole } from "@prisma/client";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { buildSubscriptionWhere } from "@/modules/export/subscriptionFilters";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    const body = await req.json();
    const {
      page = 1,
      pageSize = 50,
      ...filters
    } = body || {};

    const where = buildSubscriptionWhere(filters);

    const total = await prisma.subscription.count({ where });
    const subs = await prisma.subscription.findMany({
      where,
      orderBy: { dateDebut: "desc" },
      skip: (Number(page) - 1) * Number(pageSize),
      take: Number(pageSize),
      select: {
        id: true,
        type: true,
        statut: true,
        dateDebut: true,
        dateFin: true,
        montant: true,
        devise: true,
        source: true,
        user: { select: { email: true, nom: true } },
        enterpriseAccount: { select: { nom: true } },
        plan: { select: { nom: true } },
        promoCodeId: true,
      }
    });

    const rows = subs.map((s) => ({
      id: s.id,
      label: s.user?.email || s.enterpriseAccount?.nom || "N/A",
      subscriberType: s.enterpriseAccount ? "Entreprise" : "Individuel",
      enterprise: s.enterpriseAccount?.nom ?? null,
      plan: s.plan?.nom ?? null,
      type: s.type,
      status: s.statut,
      dateDebut: s.dateDebut ? s.dateDebut.toISOString().split("T")[0] : null,
      dateFin: s.dateFin ? s.dateFin.toISOString().split("T")[0] : null,
      montant: s.montant ? Number(s.montant) : null,
      devise: s.devise || null,
      source: s.source || null,
      hasPromo: Boolean(s.promoCodeId),
    }));

    return NextResponse.json({ rows, total });
  } catch (error: any) {
    console.error("preview export error", error);
    return NextResponse.json({ error: error?.message ?? "Erreur preview" }, { status: 400 });
  }
}
