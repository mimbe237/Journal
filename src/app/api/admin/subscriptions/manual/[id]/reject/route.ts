import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { sendManualSubscriptionRejectedEmail } from "@/modules/notifications/notificationService";

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

    const body = await req.json();
    const { motif } = body;

    if (!motif) {
      return NextResponse.json({ error: "Motif de rejet requis" }, { status: 400 });
    }

    const submission = await prisma.manualSubscriptionSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    if (submission.statut !== "PENDING") {
      return NextResponse.json({ error: "Cette soumission a déjà été traitée" }, { status: 400 });
    }

    // Update Submission
    await prisma.manualSubscriptionSubmission.update({
      where: { id },
      data: {
        statut: "REJECTED",
        motifRejet: motif,
        validePar: currentUser.id,
        valideA: new Date(),
      }
    });

    // Send Notification
    try {
      await sendManualSubscriptionRejectedEmail({
        userEmail: submission.email,
        userName: submission.nom,
        reason: motif
      });
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error rejecting submission:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
