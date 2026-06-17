import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/config/prisma";
import { getCurrentUser } from "@/lib/auth/currentUser";

// Prisma nécessite un runtime Node.js (pas edge)
export const runtime = "nodejs";

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

interface PendingEdition {
  key: string;
  filename: string;
  size: number;
  lastModified: Date | null;
  suggestedTitle: string;
  suggestedDate: string | null;
  existsInDb: boolean;
}

/**
 * Parse le nom de fichier pour extraire date et titre suggérés
 * Formats supportés:
 * - YYYY-MM-DD_Titre.pdf
 * - YYYY-MM-DD-Titre.pdf
 * - DD-MM-YYYY_Titre.pdf
 * - Titre_YYYY-MM-DD.pdf
 * - Titre.pdf (date = aujourd'hui)
 */
function parseFilename(filename: string): { suggestedTitle: string; suggestedDate: string | null } {
  // Retirer l'extension
  const nameWithoutExt = filename.replace(/\.pdf$/i, "");
  
  // Pattern: YYYY-MM-DD au début
  const isoDateStartMatch = nameWithoutExt.match(/^(\d{4}-\d{2}-\d{2})[_\-\s](.+)$/);
  if (isoDateStartMatch) {
    return {
      suggestedDate: isoDateStartMatch[1],
      suggestedTitle: isoDateStartMatch[2].replace(/[_-]/g, " ").trim(),
    };
  }
  
  // Pattern: YYYY-MM-DD à la fin
  const isoDateEndMatch = nameWithoutExt.match(/^(.+)[_\-\s](\d{4}-\d{2}-\d{2})$/);
  if (isoDateEndMatch) {
    return {
      suggestedDate: isoDateEndMatch[2],
      suggestedTitle: isoDateEndMatch[1].replace(/[_-]/g, " ").trim(),
    };
  }
  
  // Pattern: DD-MM-YYYY ou DD/MM/YYYY au début
  const euDateStartMatch = nameWithoutExt.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})[_\-\s](.+)$/);
  if (euDateStartMatch) {
    const [, day, month, year, title] = euDateStartMatch;
    return {
      suggestedDate: `${year}-${month}-${day}`,
      suggestedTitle: title.replace(/[_-]/g, " ").trim(),
    };
  }
  
  // Pattern: DD-MM-YYYY ou DD/MM/YYYY à la fin
  const euDateEndMatch = nameWithoutExt.match(/^(.+)[_\-\s](\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (euDateEndMatch) {
    const [, title, day, month, year] = euDateEndMatch;
    return {
      suggestedDate: `${year}-${month}-${day}`,
      suggestedTitle: title.replace(/[_-]/g, " ").trim(),
    };
  }
  
  // Pas de date détectée
  return {
    suggestedDate: null,
    suggestedTitle: nameWithoutExt.replace(/[_-]/g, " ").trim(),
  };
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const user = await getCurrentUser();
    if (!user || !["SUPER_ADMIN", "SUPPORT"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Lister les fichiers dans le dossier pending-editions/
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: PENDING_FOLDER,
    });

    const response = await s3Client.send(listCommand);
    const objects = response.Contents || [];

    // Filtrer seulement les fichiers PDF
    const pdfFiles = objects.filter(obj => 
      obj.Key && 
      obj.Key.toLowerCase().endsWith(".pdf") &&
      obj.Key !== PENDING_FOLDER // Exclure le dossier lui-même
    );

    // Récupérer les titres existants en base pour vérification de doublons
    const existingEditions = await prisma.edition.findMany({
      select: { titre: true, datePublication: true },
    });
    
    const existingSet = new Set(
      existingEditions.map(e => `${e.titre.toLowerCase()}_${e.datePublication.toISOString().split("T")[0]}`)
    );

    // Construire la liste des éditions en attente
    const pendingEditions: PendingEdition[] = pdfFiles.map(obj => {
      const filename = obj.Key!.replace(PENDING_FOLDER, "");
      const { suggestedTitle, suggestedDate } = parseFilename(filename);
      
      const checkKey = suggestedDate 
        ? `${suggestedTitle.toLowerCase()}_${suggestedDate}`
        : suggestedTitle.toLowerCase();
      
      return {
        key: obj.Key!,
        filename,
        size: obj.Size || 0,
        lastModified: obj.LastModified || null,
        suggestedTitle,
        suggestedDate,
        existsInDb: existingSet.has(checkKey),
      };
    });

    // Trier par date suggérée (les plus récentes d'abord), puis par nom
    pendingEditions.sort((a, b) => {
      if (a.suggestedDate && b.suggestedDate) {
        return b.suggestedDate.localeCompare(a.suggestedDate);
      }
      if (a.suggestedDate) return -1;
      if (b.suggestedDate) return 1;
      return a.filename.localeCompare(b.filename);
    });

    return NextResponse.json({
      total: pendingEditions.length,
      pending: pendingEditions.filter(e => !e.existsInDb).length,
      alreadyExists: pendingEditions.filter(e => e.existsInDb).length,
      editions: pendingEditions,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers en attente:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des fichiers" },
      { status: 500 }
    );
  }
}
