import { NextRequest, NextResponse } from "next/server";
import { SubscriptionType, JustificatifType } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";
import { fileStorageProvider } from "@/services/fileStorage";
import { sendManualSubscriptionReceivedEmail } from "@/modules/notifications/notificationService";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const nom = formData.get("nom") as string;
    const email = formData.get("email") as string;
    const type = formData.get("type") as SubscriptionType;
    const periode = formData.get("periode") as string; // e.g. "12" (months) or specific date? Schema says string. Let's assume it's a duration or identifier.
    const montantStr = formData.get("montant") as string;
    const devise = (formData.get("devise") as string) || "XOF";
    const entrepriseId = formData.get("entrepriseId") as string | null;
    
    // Files
    const files = formData.getAll("justificatifs") as File[];
    const justificatifTypes = formData.getAll("justificatifTypes") as JustificatifType[];

    if (!nom || !email || !type || !montantStr || files.length === 0) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const montant = parseFloat(montantStr);

    // 1. Create Submission Record
    const submission = await prisma.manualSubscriptionSubmission.create({
      data: {
        nom,
        email,
        type,
        periode,
        montant,
        devise,
        entrepriseId: entrepriseId || null,
        statut: "PENDING",
      },
    });

    // 2. Handle File Uploads
    const savedFiles = [];
    const storageRoot = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const typeJustif = justificatifTypes[i] || "AUTRE";
      
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop() || 'bin';
      const fileName = `justif_${submission.id}_${i}.${ext}`;
      const relativePath = path.join("submissions", submission.id, fileName);
      
      // Ensure directory exists (provider might handle it, but let's be safe if using local)
      // The LocalFileStorageProvider usually handles mkdir.
      
      await fileStorageProvider.saveFile({
        buffer,
        destinationPath: relativePath
      });

      const justificatif = await prisma.justificatif.create({
        data: {
          submissionId: submission.id,
          type: typeJustif,
          nomFichier: file.name,
          cheminFichier: relativePath,
          tailleMo: file.size / (1024 * 1024),
        }
      });
      
      savedFiles.push(justificatif);
    }

    // 3. Send Notification to Admin
    try {
      await sendManualSubscriptionReceivedEmail({
        submissionId: submission.id,
        userName: nom,
        userEmail: email,
        amount: montant,
        currency: devise
      });
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      message: "Soumission reçue avec succès" 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error submitting manual subscription:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
