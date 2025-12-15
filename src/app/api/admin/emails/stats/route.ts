import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getEmailStats } from "@/modules/emails";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];

// GET: Statistiques globales des emails
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const stats = await getEmailStats({
      templateId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("[api/admin/emails/stats] GET error:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
