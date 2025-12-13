import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!['SUPER_ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const editionId = id;
    const edition = await prisma.edition.findUnique({ where: { id: editionId } });
    if (!edition) return NextResponse.json({ error: "Édition non trouvée" }, { status: 404 });

    const formData = await req.formData();
    const coverImage = formData.get("coverImage") as File;
    if (!coverImage) return NextResponse.json({ error: "Image requise" }, { status: 400 });

    const storageRoot = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
    const editionDir = path.join(storageRoot, "editions", editionId);
    
    const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
    const ext = coverImage.name.split('.').pop() || 'jpg';
    const coverFileName = `cover.${ext}`;
    const coverFullPath = path.join(editionDir, coverFileName);
    
    await writeFile(coverFullPath, coverBuffer);
    const coverImagePath = `editions/${editionId}/${coverFileName}`;

    // Mettre à jour l'édition
    await prisma.edition.update({
      where: { id: editionId },
      data: { cheminImageUne: coverImagePath },
    });

    return NextResponse.json({ ok: true, cheminImageUne: coverImagePath });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur upload" }, { status: 500 });
  }
}
