import { NextRequest, NextResponse } from "next/server";
import { SubscriptionSource, SubscriptionStatus, SubscriptionType, UserRole } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/config/prisma";
import { registerUser } from "@/modules/auth/authService";
import { requireUserWithRoles } from "@/lib/auth/authorization";

type IncomingRow = {
  nom?: string;
  email?: string;
  telephone?: string;
  pays?: string;
  enterpriseName?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: SubscriptionStatus | string;
};

const ALLOWED = [UserRole.SUPER_ADMIN];

function pickType(dateDebut: Date, dateFin: Date): SubscriptionType {
  const diffDays = Math.abs(dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 300 ? SubscriptionType.ANNUEL : SubscriptionType.MENSUEL;
}

export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED);
    const body = await req.json();
    const rows: IncomingRow[] = body?.rows ?? [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 });
    }

    const result = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const row of rows) {
      const nom = row.nom?.trim();
      const email = row.email?.trim().toLowerCase();
      const enterpriseName = row.enterpriseName?.trim();
      const dateDebutStr = row.dateDebut;
      const dateFinStr = row.dateFin;
      const statutRaw = (row.statut || "").toString().toUpperCase() as SubscriptionStatus;

      if (!nom || !email || !dateDebutStr || !dateFinStr) {
        result.skipped += 1;
        continue;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, deletedAt: true }
      });
      if (existingUser) {
        result.skipped += 1;
        continue;
      }

      const dateDebut = new Date(dateDebutStr);
      const dateFin = new Date(dateFinStr);
      if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime()) || dateFin <= dateDebut) {
        result.skipped += 1;
        continue;
      }

      const tempPassword = randomUUID();

      let enterpriseId: string | null = null;
      if (enterpriseName) {
        const existingEnt = await prisma.enterpriseAccount.findFirst({ where: { nom: enterpriseName } });
        if (existingEnt) {
          enterpriseId = existingEnt.id;
        } else {
          const created = await prisma.enterpriseAccount.create({
            data: {
              nom: enterpriseName,
              contactEmail: email,
              contactTelephone: row.telephone || null,
              nombreUtilisateursInclus: 10,
              plagesIpAutorisees: []
            }
          });
          enterpriseId = created.id;
        }
      }

      const user = await registerUser({
        nom,
        email,
        motDePasse: tempPassword,
        role: enterpriseId ? UserRole.UTILISATEUR_ENTREPRISE : UserRole.ABONNE
      });

      if (enterpriseId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { enterpriseAccountId: enterpriseId, telephone: row.telephone || null, pays: row.pays || null }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { telephone: row.telephone || null, pays: row.pays || null }
        });
      }

      const type = pickType(dateDebut, dateFin);
      const statut: SubscriptionStatus =
        statutRaw === SubscriptionStatus.EXPIRE || statutRaw === SubscriptionStatus.SUSPENDU
          ? statutRaw
          : SubscriptionStatus.ACTIF;

      await prisma.subscription.create({
        data: {
          userId: enterpriseId ? null : user.id,
          enterpriseAccountId: enterpriseId,
          type,
          statut,
          dateDebut,
          dateFin,
          montant: 0,
          devise: "XOF",
          source: SubscriptionSource.OFFLINE
        }
      });

      result.created += 1;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Import subscribers error:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur import" }, { status: 400 });
  }
}
