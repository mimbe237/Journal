import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { randomUUID } from "crypto";
import { UserRole, SubscriptionStatus, SubscriptionSource, SubscriptionType } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma, ensurePrismaRuntimeMigrations } from "@/lib/config/prisma";
import { registerUser } from "@/modules/auth/authService";
import { createSubscriptionForEnterprise, createSubscriptionForUser } from "@/modules/subscriptions/subscriptionService";
import { fileStorageProvider } from "@/services/fileStorage";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION, UserRole.COMMERCIAL];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

export const runtime = "nodejs";

async function bufferFromFile(f: File | null): Promise<{ buffer: Buffer; filename: string } | null> {
  if (!f) return null;
  if (f.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux (${(f.size / (1024 * 1024)).toFixed(1)} Mo). Max 5 Mo : ${f.name}`);
  }
  const arrayBuffer = await f.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), filename: f.name || "upload" };
}

function pickType(start: Date, end: Date): SubscriptionType {
  const diffDays = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 300 ? SubscriptionType.ANNUEL : SubscriptionType.MENSUEL;
}

function planToSubscriptionType(plan: string | null): SubscriptionType {
  if (plan === "YEARLY") return SubscriptionType.ANNUEL;
  if (plan === "SIX_MONTHS") return SubscriptionType.MENSUEL; // pas d'Enum 6 mois, on reste sur MENSUEL/ANNUEL
  return SubscriptionType.MENSUEL;
}

export async function POST(req: NextRequest) {
  try {
    // Garantit la présence des colonnes soft-delete (deletedAt/trashedUntil) sur subscriptions en prod
    await ensurePrismaRuntimeMigrations();
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);
    const form = await req.formData();

    const nom = form.get("nom")?.toString().trim();
    const email = form.get("email")?.toString().trim().toLowerCase();
    const telephone = form.get("telephone")?.toString().trim() || null;
    const pays = form.get("pays")?.toString().trim() || null;
    const enterpriseId = form.get("enterpriseId")?.toString().trim() || null;
    const enterpriseName = form.get("enterpriseName")?.toString().trim() || null;
    const startDateStr = form.get("dateDebut")?.toString();
    const endDateStr = form.get("dateFin")?.toString();
    const journalTypeId = form.get("journalTypeId")?.toString().trim() || null;
    const plan = form.get("plan")?.toString().trim() || null; // MONTHLY | SIX_MONTHS | YEARLY | CUSTOM
    const montantStr = form.get("montant")?.toString();
    const deviseRaw = form.get("devise")?.toString();
    const paymentMethod = form.get("paymentMethod")?.toString() || "CASH";
    const bulletin = form.get("bulletin") as File | null;
    const receipt = form.get("receipt") as File | null;

    if (!nom || !email || !startDateStr || !endDateStr) {
      return NextResponse.json({ error: "Nom, email, dates de début et fin sont requis." }, { status: 400 });
    }

    const dateDebut = new Date(startDateStr);
    const dateFin = new Date(endDateStr);
    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
    }
    if (dateFin <= dateDebut) {
      return NextResponse.json({ error: "La date d'expiration doit être postérieure à la date de début." }, { status: 400 });
    }
    const devise = (deviseRaw || "XAF").toUpperCase().slice(0, 3) === "FCF" ? "XAF" : (deviseRaw || "XAF").toUpperCase().slice(0, 3);

    let montant = montantStr ? Number(montantStr) : 0;
    if (Number.isNaN(montant) || montant <= 0) {
      return NextResponse.json({ error: "Le montant est requis." }, { status: 400 });
    }

    let finalEnterpriseId = enterpriseId;
    if (!finalEnterpriseId && enterpriseName) {
      const created = await prisma.enterpriseAccount.create({
        data: {
          nom: enterpriseName,
          contactEmail: email,
          contactTelephone: telephone,
          nombreUtilisateursInclus: 10,
          plagesIpAutorisees: []
        }
      });
      finalEnterpriseId = created.id;
    }

    const isEnterprise = Boolean(finalEnterpriseId);
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-4);
    const userRole = isEnterprise ? UserRole.UTILISATEUR_ENTREPRISE : UserRole.ABONNE;

    const user = await registerUser({
      nom,
      email,
      motDePasse: tempPassword,
      role: userRole
    });

    if (finalEnterpriseId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { enterpriseAccountId: finalEnterpriseId }
      });
    }

    const subscriptionType = plan ? planToSubscriptionType(plan) : pickType(dateDebut, dateFin);

    if (isEnterprise && finalEnterpriseId) {
      await createSubscriptionForEnterprise({
        enterpriseAccountId: finalEnterpriseId,
        type: subscriptionType,
        dateDebut,
        dateFin,
        montant,
        devise,
        source: SubscriptionSource.OFFLINE,
        paymentMethod
      });
    } else {
      await createSubscriptionForUser({
        userId: user.id,
        type: subscriptionType,
        dateDebut,
        dateFin,
        montant,
        devise,
        source: SubscriptionSource.OFFLINE,
        paymentMethod
      });
    }

    const submission = await prisma.manualSubscriptionSubmission.create({
      data: {
        email,
        nom,
        telephone,
        pays,
        entrepriseId: finalEnterpriseId,
        type: subscriptionType,
        periode: `${startDateStr}__${endDateStr}`,
        montant,
        devise
      }
    });

    const saveDoc = async (doc: File | null, type: "BULLETIN_ABONNEMENT" | "RECU_CAISSE") => {
      const data = await bufferFromFile(doc);
      if (!data) return;
      const ext = path.extname(data.filename) || ".dat";
      const dest = `manual-submissions/${submission.id}/${type.toLowerCase()}-${randomUUID()}${ext}`;
      await fileStorageProvider.saveFile({ buffer: data.buffer, destinationPath: dest });
      await prisma.documentJustificatif.create({
        data: {
          submissionId: submission.id,
          type,
          nomFichier: data.filename,
          cheminFichier: dest,
          tailleMo: data.buffer.length / (1024 * 1024)
        }
      });
    };

    await saveDoc(bulletin, "BULLETIN_ABONNEMENT");
    await saveDoc(receipt, "RECU_CAISSE");

    return NextResponse.json({ ok: true, userId: user.id, submissionId: submission.id });
  } catch (error: any) {
    console.error("Create subscriber error:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur création abonné" }, { status: 400 });
  }
}

