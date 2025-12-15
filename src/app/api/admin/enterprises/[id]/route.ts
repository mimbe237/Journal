import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { AuthorizationError, requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";
import { reportError } from "@/lib/observability/errorReporter";

// GET : récupère les détails d'un compte entreprise
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);

    const enterprise = await prisma.enterpriseAccount.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            nom: true,
            email: true,
            role: true,
            dernierLoginAt: true
          }
        },
        subscriptions: {
          orderBy: { dateFin: 'desc' }
        },
        invitations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ enterprise }, { status: 200 });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/enterprises/:id] failed to load", error);
    await reportError({
      message: "Failed to load enterprise account",
      error,
      context: {
        enterpriseId: id,
        url: req.url
      }
    });
    return NextResponse.json({ error: error?.message ?? "Erreur de chargement" }, { status: 500 });
  }
}

// PATCH : met à jour un compte entreprise (licences, contact, etc.)
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  try {
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
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/enterprises/:id] failed to update", error);
    await reportError({
      message: "Failed to update enterprise account",
      error,
      context: {
        enterpriseId: id,
        url: req.url
      }
    });
    return NextResponse.json({ error: error?.message ?? "Erreur de mise à jour" }, { status: 500 });
  }
}
