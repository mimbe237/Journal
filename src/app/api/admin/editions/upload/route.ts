import { NextRequest, NextResponse } from "next/server";
import { mkdir, readdir, readFile, rm } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";
import { EditionType } from "@prisma/client";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { convertPdfToImages, createEditionInDb } from "@/modules/editions/editionUploadService";
import { fileStorageProvider } from "@/services/fileStorage";

export async function POST(req: NextRequest) {
  let tempDir: string | null = null;

  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!['SUPER_ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const formData = await req.formData();
    // On attend désormais une clé de fichier (uploadé via presigned URL)
    const fileKey = formData.get("fileKey") as string;
    const coverImage = formData.get("coverImage") as File | null;
    const titre = formData.get("titre") as string;
    const type = (formData.get("type") as string) || "QUOTIDIEN";
    const datePublicationStr = formData.get("datePublication") as string;
    const prixRaw = formData.get("prix") as string | null;
    const devise = (formData.get("devise") as string | null)?.toUpperCase() || null;

    if (!fileKey) return NextResponse.json({ error: "Fichier PDF requis (fileKey manquant)" }, { status: 400 });
    if (!titre) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

    const editionId = require("crypto").randomUUID();
    
    // Création d'un dossier temporaire pour le traitement
    tempDir = path.join(os.tmpdir(), "journal-upload", editionId);
    await mkdir(tempDir, { recursive: true });

    const localPdfPath = path.join(tempDir, "source.pdf");
    const imagesDir = path.join(tempDir, "images");
    await mkdir(imagesDir, { recursive: true });

    // 1. Télécharger le PDF depuis le stockage (R2/S3) vers le dossier temporaire
    console.log(`Downloading PDF from ${fileKey} to ${localPdfPath}...`);
    const fileStream = await fileStorageProvider.getFileStream({ path: fileKey });
    await pipeline(fileStream, createWriteStream(localPdfPath));

    // 2. Convertir le PDF en images
    console.log("Converting PDF to images...");
    let pageCount = 0;
    try {
      pageCount = await convertPdfToImages(localPdfPath, imagesDir);
    } catch (err: any) {
      console.error("Conversion error:", err);
      return NextResponse.json(
        { error: `Conversion échouée: ${err.message}` },
        { status: 400 }
      );
    }

    // 3. Uploader les images générées vers le stockage
    console.log(`Uploading ${pageCount} images to storage...`);
    const imageFiles = await readdir(imagesDir);
    for (const file of imageFiles) {
      if (!file.endsWith('.webp')) continue;
      const buffer = await readFile(path.join(imagesDir, file));
      await fileStorageProvider.saveFile({
        buffer,
        destinationPath: `editions/${editionId}/images/${file}`
      });
    }

    // 4. Copier le PDF vers son emplacement final
    // On le lit depuis le disque local pour le ré-uploader au bon endroit
    const pdfBuffer = await readFile(localPdfPath);
    await fileStorageProvider.saveFile({
      buffer: pdfBuffer,
      destinationPath: `editions/${editionId}/source.pdf`
    });

    // 5. Upload de l'image de couverture si fournie
    let coverImagePath: string | null = null;
    if (coverImage) {
      const coverBuffer = Buffer.from(await coverImage.arrayBuffer());
      const ext = coverImage.name.split('.').pop() || 'jpg';
      const coverFileName = `cover.${ext}`;
      const key = `editions/${editionId}/${coverFileName}`;
      await fileStorageProvider.saveFile({
        buffer: coverBuffer,
        destinationPath: key
      });
      coverImagePath = key;
    }

    // 6. Créer l'entrée en base de données
    const datePublication = datePublicationStr ? new Date(datePublicationStr) : new Date();
    const prix = prixRaw ? Number(prixRaw) : null;
    const edition = await createEditionInDb({
      titre,
      datePublication,
      type: type as EditionType,
      nombrePages: pageCount,
      cheminInternePdf: `editions/${editionId}/source.pdf`,
      cheminImageUne: coverImagePath || `editions/${editionId}/images/page-1.webp`,
      prix: prix ?? null,
      devise
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
    console.error("Upload error:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur upload" }, { status: 400 });
  } finally {
    // Nettoyage du dossier temporaire
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Error cleaning up temp dir:", e);
      }
    }
  }
}
