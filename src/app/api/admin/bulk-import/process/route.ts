import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/config/prisma";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { convertPdfToImages } from "@/services/pdf/pdfConversionService";
import fs from "fs";
import path from "path";
import os from "os";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";

// Configuration S3/R2
const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "journal-storage";
const PENDING_FOLDER = "pending-editions/";

interface EditionToProcess {
  key: string;
  title: string;
  datePublication: string;
  type: "QUOTIDIEN" | "HEBDOMADAIRE" | "SPECIAL";
}

interface ProcessResult {
  key: string;
  success: boolean;
  editionId?: string;
  error?: string;
  pageCount?: number;
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function downloadPdfFromR2(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error(`Fichier non trouvé: ${key}`);
  }
  
  return streamToBuffer(response.Body as Readable);
}

async function uploadImageToR2(buffer: Buffer, destPath: string): Promise<void> {
  const key = destPath.startsWith("/") ? destPath.slice(1) : destPath;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "image/webp",
  });
  
  await s3Client.send(command);
}

async function uploadPdfToR2(buffer: Buffer, destPath: string): Promise<void> {
  const key = destPath.startsWith("/") ? destPath.slice(1) : destPath;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "application/pdf",
  });
  
  await s3Client.send(command);
}

async function deletePdfFromPending(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  
  await s3Client.send(command);
}

async function processEdition(edition: EditionToProcess): Promise<ProcessResult> {
  const tempDir = path.join(os.tmpdir(), `bulk-import-${uuidv4()}`);
  
  try {
    // Créer le dossier temporaire
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Télécharger le PDF
    console.log(`[BulkImport] Téléchargement de ${edition.key}...`);
    const pdfBuffer = await downloadPdfFromR2(edition.key);
    const pdfPath = path.join(tempDir, "input.pdf");
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    // Convertir en images
    console.log(`[BulkImport] Conversion de ${edition.title}...`);
    const outputDir = path.join(tempDir, "images");
    fs.mkdirSync(outputDir, { recursive: true });
    
    const result = await convertPdfToImages({
      pdfPath,
      outputDir,
      filenamePrefix: "page-",
      density: 180,
      quality: 92,
    });
    
    if (result.pageCount === 0) {
      throw new Error("Aucune page convertie");
    }
    
    // Générer un ID unique pour l'édition
    const editionId = uuidv4();
    const editionFolder = `editions/${editionId}`;
    
    // Uploader le PDF original
    console.log(`[BulkImport] Upload du PDF vers ${editionFolder}...`);
    await uploadPdfToR2(pdfBuffer, `${editionFolder}/original.pdf`);
    
    // Uploader les images
    console.log(`[BulkImport] Upload des ${result.pageCount} images...`);
    const imageFiles = fs.readdirSync(outputDir)
      .filter(f => f.endsWith(".webp"))
      .sort();
    
    for (const imageFile of imageFiles) {
      const imagePath = path.join(outputDir, imageFile);
      const imageBuffer = fs.readFileSync(imagePath);
      await uploadImageToR2(imageBuffer, `${editionFolder}/images/${imageFile}`);
    }
    
    // Créer l'entrée en base de données
    console.log(`[BulkImport] Création de l'édition en base...`);
    const dbEdition = await prisma.edition.create({
      data: {
        id: editionId,
        titre: edition.title,
        datePublication: new Date(edition.datePublication),
        type: edition.type,
        nombrePages: result.pageCount,
        cheminInternePdf: `${editionFolder}/original.pdf`,
        cheminImageUne: `${editionFolder}/images/page-1.webp`,
        prix: null,
        devise: null,
      },
    });
    
    // Créer l'événement système
    await prisma.systemEvent.create({
      data: {
        typeEvenement: "CREATION_EDITION",
        meta: {
          editionId: dbEdition.id,
          titre: dbEdition.titre,
          source: "bulk-import",
        },
      },
    });
    
    // Supprimer le PDF du dossier pending
    console.log(`[BulkImport] Suppression du fichier source...`);
    await deletePdfFromPending(edition.key);
    
    return {
      key: edition.key,
      success: true,
      editionId: dbEdition.id,
      pageCount: result.pageCount,
    };
  } catch (error: any) {
    console.error(`[BulkImport] Erreur pour ${edition.key}:`, error);
    return {
      key: edition.key,
      success: false,
      error: error.message || "Erreur inconnue",
    };
  } finally {
    // Nettoyer le dossier temporaire
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.error("[BulkImport] Erreur lors du nettoyage:", e);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "SUPPORT"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const editions: EditionToProcess[] = body.editions;

    if (!editions || !Array.isArray(editions) || editions.length === 0) {
      return NextResponse.json(
        { error: "Liste d'éditions requise" },
        { status: 400 }
      );
    }

    // Limiter à 5 éditions par requête pour éviter les timeouts
    const MAX_BATCH_SIZE = 5;
    if (editions.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} éditions par requête` },
        { status: 400 }
      );
    }

    // Valider les données
    for (const edition of editions) {
      if (!edition.key || !edition.title || !edition.datePublication || !edition.type) {
        return NextResponse.json(
          { error: `Données manquantes pour l'édition: ${edition.key || "inconnu"}` },
          { status: 400 }
        );
      }
      
      if (!["QUOTIDIEN", "HEBDOMADAIRE", "SPECIAL"].includes(edition.type)) {
        return NextResponse.json(
          { error: `Type invalide pour ${edition.key}: ${edition.type}` },
          { status: 400 }
        );
      }
    }

    // Traiter les éditions séquentiellement
    const results: ProcessResult[] = [];
    for (const edition of editions) {
      const result = await processEdition(edition);
      results.push(result);
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
    });
  } catch (error: any) {
    console.error("[BulkImport] Erreur générale:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement" },
      { status: 500 }
    );
  }
}
