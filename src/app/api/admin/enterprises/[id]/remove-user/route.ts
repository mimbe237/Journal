import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { removeUserFromEnterpriseAccount } from "@/modules/enterprises/enterpriseService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    const body = await req.json();
    const { userId } = body ?? {};

    const user = await removeUserFromEnterpriseAccount({
      enterpriseAccountId: id,
      userId
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la suppression" }, { status: 400 });
  }
}
