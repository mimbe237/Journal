import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { listEnterpriseUsers } from "@/modules/enterprises/enterpriseService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
    const users = await listEnterpriseUsers(id);
    return NextResponse.json({ data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la récupération" }, { status: 400 });
  }
}
