import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { AuthorizationError, requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import { reportError } from "@/lib/observability/errorReporter";

// GET liste des abonnements (admin)
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    await prismaRuntimeReady;

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');

    const where: any = {};
    if (view === 'trash') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
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
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/subscriptions] failed to load", error);
    await reportError({
      message: "Failed to load subscriptions",
      error,
      context: {
        url: req.url
      }
    });
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 500 });
  }
}
