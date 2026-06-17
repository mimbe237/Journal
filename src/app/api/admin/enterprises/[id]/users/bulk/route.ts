import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

// Création en masse d'utilisateurs pour un compte entreprise
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: enterpriseId } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    const body = await req.json();
    const users = Array.isArray(body?.users) ? body.users : [];

    const enterprise = await prisma.enterpriseAccount.findUnique({
      where: { id: enterpriseId },
      include: { _count: { select: { users: true } } }
    });
    if (!enterprise) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
    }

    const licencesDisponibles = enterprise.nombreUtilisateursInclus - (enterprise._count?.users || 0);
    if (licencesDisponibles <= 0) {
      return NextResponse.json({ error: "Aucune licence disponible" }, { status: 400 });
    }

    const toCreate = users
      .filter((u: any) => u?.email && u?.nom)
      .slice(0, licencesDisponibles)
      .map((u: any) => ({
        nom: u.nom,
        email: u.email.toLowerCase(),
        motDePasseHash: "placeholder", // l’admin devra définir un flux d’invitation/réinitialisation
        role: "UTILISATEUR_ENTREPRISE" as const,
        enterpriseAccountId: enterpriseId,
        fonction: u.fonction || null
      }));

    if (toCreate.length === 0) {
      return NextResponse.json({ error: "Aucun utilisateur valide à créer ou plus de licences" }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (const data of toCreate) {
        const user = await tx.user.create({
          data: {
            nom: data.nom,
            email: data.email,
            role: "UTILISATEUR_ENTREPRISE",
            enterpriseAccountId: data.enterpriseAccountId,
            // fonction: data.fonction, // Champ non existant dans le schéma User actuel
            // TODO: générer et envoyer un mot de passe/invitation réel
            motDePasseHash: data.motDePasseHash
          }
        });
        rows.push(user);
      }
      return rows;
    });

    return NextResponse.json(
      {
        createdCount: created.length,
        remainingLicences: licencesDisponibles - created.length
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'ajout en masse" }, { status: 400 });
  }
}
