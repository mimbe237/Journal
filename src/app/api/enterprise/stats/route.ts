/**
 * API Route pour les statistiques de l'entreprise
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !user.enterpriseAccountId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const enterprise = await prisma.enterpriseAccount.findUnique({
      where: { id: user.enterpriseAccountId },
      select: { nombreUtilisateursInclus: true }
    });

    const [userCount, pendingInvites] = await Promise.all([
      prisma.user.count({
        where: { enterpriseAccountId: user.enterpriseAccountId }
      }),
      prisma.enterpriseInvitation.count({
        where: {
          enterpriseAccountId: user.enterpriseAccountId,
          acceptedAt: null,
          expireAt: { gt: new Date() }
        }
      })
    ]);

    const stats = {
      totalLicenses: enterprise?.nombreUtilisateursInclus ?? 0,
      usedLicenses: userCount,
      pendingInvites,
      availableLicenses: Math.max(0, (enterprise?.nombreUtilisateursInclus ?? 0) - userCount - pendingInvites)
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Erreur GET /api/enterprise/stats:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
