import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { listEnterpriseUsers } from "@/modules/enterprises/enterpriseService";

export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.COMPTE_ENTREPRISE]);
    const user = await getCurrentUserFromRequest(req);
    if (!user?.enterpriseAccountId) {
      return NextResponse.json({ error: "Aucun compte entreprise associé" }, { status: 403 });
    }

    const users = await listEnterpriseUsers(user.enterpriseAccountId);
    return NextResponse.json({ data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la récupération" }, { status: 400 });
  }
}
