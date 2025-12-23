import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { SystemEventType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const logs = await prisma.systemEvent.findMany({
      where: {
        userId: user.id,
        typeEvenement: SystemEventType.CONNEXION,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        ip: true,
        meta: true,
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        date: log.createdAt,
        ip: log.ip,
        device: (log.meta as any)?.userAgent || "Inconnu",
      })),
    });
  } catch (error) {
    console.error("Security logs error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
