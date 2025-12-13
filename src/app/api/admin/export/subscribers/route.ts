import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { exportSubscribersCsv } from "@/modules/export/exportService";

export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION]);
    const csv = await exportSubscribersCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="subscribers.csv"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur export abonnés" }, { status: 400 });
  }
}
