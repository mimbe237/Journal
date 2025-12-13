import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

// GET liste des abonnements (admin)
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);

    const subscriptions = await prisma.subscription.findMany({
      orderBy: { dateDebut: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            email: true,
          }
        },
        enterpriseAccount: {
          select: {
            id: true,
            nom: true,
          }
        },
        promoCode: {
          select: {
            code: true,
          }
        }
      },
      take: 500, // Limiter à 500 pour la performance
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 400 });
  }
}
