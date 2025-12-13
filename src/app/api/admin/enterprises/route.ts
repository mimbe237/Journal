import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { createEnterpriseAccount } from "@/modules/enterprises/enterpriseService";
import { prisma } from "@/lib/config/prisma";

// GET liste paginée des comptes entreprises
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION]);
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get("take") ?? "20", 10), 100);
    const skip = parseInt(searchParams.get("skip") ?? "0", 10);

    const enterprises = await prisma.enterpriseAccount.findMany({
      orderBy: { dateCreation: "desc" },
      take,
      skip,
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    return NextResponse.json({ enterprises });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 400 });
  }
}

// POST création d'un compte entreprise
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    const body = await req.json();
    const { 
      nom, 
      contactEmail, 
      contactTelephone, 
      nombreUtilisateursInclus,
      niveauSla,
      adresseFacturation,
      numeroSiret 
    } = body ?? {};

    const enterprise = await prisma.enterpriseAccount.create({
      data: {
        nom,
        contactEmail,
        contactTelephone,
        nombreUtilisateursInclus: nombreUtilisateursInclus || 5,
        niveauSla: niveauSla || 'standard',
        adresseFacturation,
        numeroSiret,
      }
    });

    return NextResponse.json({ enterprise }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la création" }, { status: 400 });
  }
}
