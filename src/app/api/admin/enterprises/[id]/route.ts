import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

// PATCH : met à jour un compte entreprise (licences, contact, etc.)
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    const body = await req.json();
    const { nombreUtilisateursInclus, contactEmail, contactTelephone, nom } = body ?? {};

    const data: any = {};
    if (typeof nombreUtilisateursInclus === "number" && nombreUtilisateursInclus >= 0) {
      data.nombreUtilisateursInclus = nombreUtilisateursInclus;
    }
    if (typeof contactEmail === "string") data.contactEmail = contactEmail;
    if (typeof contactTelephone === "string") data.contactTelephone = contactTelephone;
    if (typeof nom === "string") data.nom = nom;

    const enterprise = await prisma.enterpriseAccount.update({
      where: { id },
      data
    });

    return NextResponse.json({ enterprise }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de mise à jour" }, { status: 400 });
  }
}
