import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { fileStorageProvider } from "@/services/fileStorage";
import { UserRole } from "@prisma/client";

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: justificatifId } = await params;
  
  const justificatif = await prisma.documentJustificatif.findUnique({
    where: { id: justificatifId }
  });

  if (!justificatif) {
    return NextResponse.json({ error: "Justificatif introuvable" }, { status: 404 });
  }

  try {
    const stream = await fileStorageProvider.getFileStream({ path: justificatif.cheminFichier });
    const buffer = await streamToBuffer(stream);
    const body = new Uint8Array(buffer);
    
    const ext = justificatif.nomFichier.split('.').pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "pdf") contentType = "application/pdf";
    else if (["jpg", "jpeg"].includes(ext || "")) contentType = "image/jpeg";
    else if (ext === "png") contentType = "image/png";

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${justificatif.nomFichier}"`
      }
    });

  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "Erreur lors de la lecture du fichier" }, { status: 500 });
  }
}
