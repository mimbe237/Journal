import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { EditionType } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { convertPdfToImages, createEditionInDb } from "@/modules/editions/editionUploadService";

export const config = {
  api: { bodyParser: { sizeLimit: "100mb" } }
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!['SUPER_ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const coverImage = formData.get("coverImage") as File | null;
    const titre = formData.get("titre") as string;
    const type = (formData.get("type") as string) || "QUOTIDIEN";
    const datePublicationStr = formData.get("datePublication") as string;

    if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    if (!titre) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const editionId = require("crypto").randomUUID();
    const storageRoot = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
    const editionDir = path.join(storageRoot, "editions", editionId);
    const pdfPath = path.join(editionDir, "source.pdf");
    const imagesDir = path.join(editionDir, "images");

    await mkdir(editionDir, { recursive: true });
    await writeFile(pdfPath, buffer);

    // Upload de l'image de couverture si fournie
    let coverImagePath: string | null = null;
    if (coverImage) {
      const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
      const ext = coverImage.name.split('.').pop() || 'jpg';
      const coverFileName = `cover.${ext}`;
      const coverFullPath = path.join(editionDir, coverFileName);
      await writeFile(coverFullPath, coverBuffer);
      coverImagePath = `editions/${editionId}/${coverFileName}`;
    }

    let pageCount = 0;
    try {
      pageCount = await convertPdfToImages(pdfPath, imagesDir);
    } catch (err) {
      return NextResponse.json(
        { error: `Conversion échouée. ImageMagick installé ? ${(err as any).message}` },
        { status: 400 }
      );
    }

    const datePublication = datePublicationStr ? new Date(datePublicationStr) : new Date();
    const edition = await createEditionInDb({
      titre,
      datePublication,
      type: type as EditionType,
      nombrePages: pageCount,
      cheminInternePdf: `editions/${editionId}/source.pdf`,
      cheminImageUne: coverImagePath || `editions/${editionId}/images/page-1.webp`
    });

    return NextResponse.json(
      {
        ok: true,
        editionId: edition.id,
        titre: edition.titre,
        pageCount,
        message: `${pageCount} pages converties`
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur upload" }, { status: 400 });
  }
}
