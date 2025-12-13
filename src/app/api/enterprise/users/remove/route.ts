import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { removeUserFromEnterpriseAccount } from "@/modules/enterprises/enterpriseService";

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.COMPTE_ENTREPRISE]);
    const actingUser = await getCurrentUserFromRequest(req);
    if (!actingUser?.enterpriseAccountId) {
      return NextResponse.json({ error: "Aucun compte entreprise associé" }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = body ?? {};

    const user = await removeUserFromEnterpriseAccount({
      enterpriseAccountId: actingUser.enterpriseAccountId,
      userId
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors du retrait" }, { status: 400 });
  }
}
