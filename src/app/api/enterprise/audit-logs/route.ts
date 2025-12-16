/**
 * API Route pour récupérer les logs d'audit de l'entreprise
 * NOTE: Cette fonctionnalité nécessite la migration enterprise_admin_system
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Essayer de récupérer les logs d'audit avec $queryRaw
    let logs: any[] = [];
    try {
      logs = await prisma.$queryRaw`
        SELECT * FROM enterprise_audit_logs 
        WHERE "enterpriseAccountId" = ${user.enterpriseAccountId}
        ORDER BY "performedAt" DESC
        LIMIT ${Math.min(limit, 100)}
        OFFSET ${offset}
      `;
    } catch {
      // Table n'existe pas encore
      return NextResponse.json({ logs: [], message: "Fonctionnalité en cours de déploiement" });
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Erreur GET /api/enterprise/audit-logs:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
