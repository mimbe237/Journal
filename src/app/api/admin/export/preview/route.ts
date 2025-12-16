import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { UserRole } from "@prisma/client";
import { requireUserWithRoles } from "@/lib/auth/authorization";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    const body = await req.json();
    const {
      status = "all",
      startDate,
      endDate,
      subscriberType = "all",
      page = 1,
      pageSize = 50
    } = body || {};

    // Build where clause
    const where: any = {};
    if (status !== "all") {
      where.statut = status;
    }
    if (startDate) {
      where.dateDebut = { ...(where.dateDebut || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      where.dateFin = { ...(where.dateFin || {}), lte: new Date(endDate) };
    }
    if (subscriberType === "individual") {
      where.userId = { not: null };
    } else if (subscriberType === "enterprise") {
      where.enterpriseAccountId = { not: null };
    }

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
      }
    });

    const rows = subs.map((s) => ({
      id: s.id,
      label: s.user?.email || s.enterpriseAccount?.nom || "N/A",
      subscriberType: s.user ? "Individuel" : "Entreprise",
      type: s.type,
      status: s.statut,
      dateDebut: s.dateDebut ? s.dateDebut.toISOString().split("T")[0] : null,
      dateFin: s.dateFin ? s.dateFin.toISOString().split("T")[0] : null,
      montant: s.montant ? Number(s.montant) : null,
      devise: s.devise || null,
      source: s.source || null,
    }));

    return NextResponse.json({ rows, total });
  } catch (error: any) {
    console.error("preview export error", error);
    return NextResponse.json({ error: error?.message ?? "Erreur preview" }, { status: 400 });
  }
}
