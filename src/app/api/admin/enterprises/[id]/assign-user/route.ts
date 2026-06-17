import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { assignUserToEnterpriseAccount } from "@/modules/enterprises/enterpriseService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    const body = await req.json();
    const { userId, role } = body ?? {};

    const user = await assignUserToEnterpriseAccount({
      enterpriseAccountId: id,
      userId,
      role
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'affectation" }, { status: 400 });
  }
}
