import { NextRequest, NextResponse } from "next/server";
import { JustificatifType, SubmissionStatus, SubscriptionType, UserRole } from "@prisma/client";
import path from "path";

import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { fileStorageProvider } from "@/services/fileStorage";

export const runtime = "nodejs";

function sanitizeDevise(devise: string | null | undefined) {
  if (!devise) return "XAF";
  const upper = devise.toUpperCase();
  if (upper === "FCFA") return "XAF";
  return upper.slice(0, 3);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION, UserRole.COMPTE_ENTREPRISE]);

    const form = await req.formData();
    const enterpriseAccountId = form.get("enterpriseAccountId")?.toString();
    const contactName = form.get("contactName")?.toString() || "Contact entreprise";
    const contactEmail = form.get("contactEmail")?.toString() || "";
    const telephone = form.get("telephone")?.toString() || null;
    const pays = form.get("pays")?.toString() || null;
    const type = (form.get("type")?.toString() as SubscriptionType) || SubscriptionType.ANNUEL;
    const dateDebut = form.get("dateDebut")?.toString();
    const dateFin = form.get("dateFin")?.toString();
    const montantStr = form.get("montant")?.toString();
    const devise = sanitizeDevise(form.get("devise")?.toString());
    const licencesDemandeesStr = form.get("licencesDemandees")?.toString();

    const bulletin = form.get("bulletin") as File | null;
    const receipt = form.get("receipt") as File | null;

    if (!enterpriseAccountId) return NextResponse.json({ error: "enterpriseAccountId requis" }, { status: 400 });
    if (!contactEmail) return NextResponse.json({ error: "Email de contact requis" }, { status: 400 });
    if (!dateDebut || !dateFin) return NextResponse.json({ error: "Dates requises" }, { status: 400 });
    if (!montantStr) return NextResponse.json({ error: "Montant requis" }, { status: 400 });

    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    if (!(start < end)) return NextResponse.json({ error: "La date de fin doit être postérieure à la date de début" }, { status: 400 });

    const montant = Number(montantStr);
    if (Number.isNaN(montant) || montant < 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });

    // Vérifie que l'utilisateur entreprise soumet pour son propre compte
    if (user && user.role === UserRole.COMPTE_ENTREPRISE && user.enterpriseAccountId !== enterpriseAccountId) {
      return NextResponse.json({ error: "Vous ne pouvez soumettre que pour votre entreprise" }, { status: 403 });
    }

    const licencesDemandees = licencesDemandeesStr ? Math.max(1, Number(licencesDemandeesStr)) : undefined;
    const periode = licencesDemandees ? `${dateDebut}__${dateFin}__licences-${licencesDemandees}` : `${dateDebut}__${dateFin}`;

    const submission = await prisma.manualSubscriptionSubmission.create({
      data: {
        email: contactEmail,
        nom: contactName,
        telephone,
        pays,
        entrepriseId: enterpriseAccountId,
        type,
        periode,
        montant,
        devise,
        statut: SubmissionStatus.PENDING,
      },
    });

    const saveDoc = async (file: File | null, type: JustificatifType) => {
      if (!file) return;
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "dat";
      const dest = path.join("manual-submissions", submission.id, `${type.toLowerCase()}-${Date.now()}.${ext}`);
      await fileStorageProvider.saveFile({ buffer, destinationPath: dest });
      await prisma.documentJustificatif.create({
        data: {
          submissionId: submission.id,
          type,
          nomFichier: file.name,
          cheminFichier: dest,
          tailleMo: buffer.length / (1024 * 1024),
        },
      });
    };

    await Promise.all([
      saveDoc(bulletin, JustificatifType.BULLETIN_ABONNEMENT),
      saveDoc(receipt, JustificatifType.RECU_CAISSE),
    ]);

    return NextResponse.json({ ok: true, submissionId: submission.id }, { status: 201 });
  } catch (error: any) {
    console.error("[manual enterprise subscription] error:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la soumission" }, { status: 400 });
  }
}
