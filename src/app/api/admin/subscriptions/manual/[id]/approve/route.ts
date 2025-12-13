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

    // 1. Find or Create User
    let user = await prisma.user.findUnique({
      where: { email: submission.email },
    });

    if (!user) {
      // Create user with a placeholder password or handle invitation flow
      // For now, we create a user with role ABONNE (or UTILISATEUR_ENTREPRISE if enterpriseId is set?)
      // If enterpriseId is set, they should probably be linked to it.
      
      user = await prisma.user.create({
        data: {
          email: submission.email,
          nom: submission.nom,
          role: submission.entrepriseId ? "UTILISATEUR_ENTREPRISE" : "ABONNE",
          enterpriseAccountId: submission.entrepriseId || null,
          // TODO: Handle password generation / email invitation
          motDePasseHash: "MANUAL_CREATION_PLACEHOLDER", 
        }
      });
    } else {
      // If user exists but we have an enterpriseId in submission, maybe we should link them?
      // Let's be careful not to override existing enterprise links without check.
      // For now, we assume the submission matches the user's context or we just link the subscription.
    }

    // 2. Create Subscription
    // Calculate dates based on 'periode' (assuming it's months count for now, or we need logic)
    // If 'periode' is "12", it's 1 year.
    // Let's assume 'periode' is a number of months string.
    
    const months = parseInt(submission.periode);
    const dateDebut = new Date();
    const dateFin = new Date();
    if (!isNaN(months)) {
      dateFin.setMonth(dateFin.getMonth() + months);
    } else {
      // Fallback or error? Let's default to 1 month if parse fails
      dateFin.setMonth(dateFin.getMonth() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        enterpriseAccountId: submission.entrepriseId || null,
        type: submission.type,
        statut: "ACTIF",
        dateDebut,
        dateFin,
        montant: submission.montant,
        devise: submission.devise,
        source: "OFFLINE", // Manual submission implies offline payment usually
        submissionId: submission.id,
      }
    });

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
      await sendManualSubscriptionApprovedEmail({
        userEmail: user.email,
        userName: user.nom || "Abonné",
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    return NextResponse.json({ 
      success: true, 
      subscription,
      user 
    });

  } catch (error: any) {
    console.error("Error approving submission:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
