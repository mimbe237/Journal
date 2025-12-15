import { NextRequest, NextResponse } from "next/server";
import { UserRole, SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { sendManualSubscriptionApprovedEmail } from "@/modules/notifications/notificationService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await requireUserWithRoles(req, undefined, [
      UserRole.FACTURATION, 
      UserRole.SUPPORT, 
      UserRole.SUPER_ADMIN
    ]);

    const submission = await prisma.manualSubscriptionSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    if (submission.statut !== "PENDING") {
      return NextResponse.json({ error: "Cette soumission a déjà été traitée" }, { status: 400 });
    }

    // Dates : priorité au format "start__end" (+ __licences-X), sinon fallback en mois
    let dateDebut = new Date();
    let dateFin = new Date();
    let licencesDemandees: number | undefined;
    if (submission.periode?.includes("__")) {
      const [start, end, extra] = submission.periode.split("__");
      const dStart = new Date(start);
      const dEnd = new Date(end);
      if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dStart < dEnd) {
        dateDebut = dStart;
        dateFin = dEnd;
      }
      if (extra?.startsWith("licences-")) {
        const n = parseInt(extra.replace("licences-", ""));
        if (!isNaN(n) && n > 0) licencesDemandees = n;
      }
    } else {
      const months = parseInt(submission.periode);
      if (!isNaN(months)) {
        dateFin.setMonth(dateFin.getMonth() + months);
      } else {
        dateFin.setMonth(dateFin.getMonth() + 1);
      }
    }

    // 1. Si soumission entreprise : créer un abonnement entreprise sans créer de user
    let user: any = null;
    let createdSubscription: any = null;
    if (submission.entrepriseId) {
      createdSubscription = await prisma.subscription.create({
        data: {
          enterpriseAccountId: submission.entrepriseId,
          type: submission.type,
          statut: "ACTIF",
          dateDebut,
          dateFin,
          montant: submission.montant,
          devise: submission.devise,
          source: "OFFLINE",
          submissionId: submission.id,
        }
      });

      // Met à jour le quota de licences si demandé
      if (licencesDemandees) {
        const current = await prisma.enterpriseAccount.findUnique({
          where: { id: submission.entrepriseId },
          select: { nombreUtilisateursInclus: true }
        });
        const target = Math.max(current?.nombreUtilisateursInclus ?? 0, licencesDemandees);
        await prisma.enterpriseAccount.update({
          where: { id: submission.entrepriseId },
          data: { nombreUtilisateursInclus: target }
        });
      }
    } else {
      // 2. Sinon (individuel) -> find or create user puis abonnement user
      user = await prisma.user.findUnique({
        where: { email: submission.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: submission.email,
            nom: submission.nom,
            role: "ABONNE",
            motDePasseHash: "MANUAL_CREATION_PLACEHOLDER",
          }
        });
      }

      createdSubscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          enterpriseAccountId: null,
          type: submission.type,
          statut: "ACTIF",
          dateDebut,
          dateFin,
          montant: submission.montant,
          devise: submission.devise,
          source: "OFFLINE",
          submissionId: submission.id,
        }
      });
    }

    // 3. Update Submission
    await prisma.manualSubscriptionSubmission.update({
      where: { id },
      data: {
        statut: "APPROVED",
        validePar: currentUser.id,
        valideA: new Date(),
      }
    });

    // 4. Send Notification
    try {
      if (user) {
        await sendManualSubscriptionApprovedEmail({
          userEmail: user.email,
          userName: user.nom || "Abonné",
        });
      }
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    return NextResponse.json({ 
      success: true, 
      subscription: createdSubscription,
      user 
    });

  } catch (error: any) {
    console.error("Error approving submission:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
