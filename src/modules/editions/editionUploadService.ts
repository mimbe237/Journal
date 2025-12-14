import { prisma } from "@/lib/config/prisma";
import { convertPdfToImages as convertPdfToImagesWithSharp } from "@/services/pdf/pdfConversionService";
import fs from "fs";
import path from "path";
// Avoid importing Prisma enum to keep types simple here
type EditionType = any;

/**
 * Convertit un PDF en images WebP (une par page).
 * Utilise sharp (libvips), compatible Vercel (pas d'ImageMagick requis).
 */
export async function convertPdfToImages(pdfPath: string, outputDir: string): Promise<number> {
  const resolvedPdfPath = path.resolve(pdfPath);
  const resolvedOutputDir = path.resolve(outputDir);

  if (!fs.existsSync(resolvedPdfPath)) {
    throw new Error(`PDF not found: ${resolvedPdfPath}`);
  }

  const result = await convertPdfToImagesWithSharp({
    pdfPath: resolvedPdfPath,
    outputDir: resolvedOutputDir,
    filenamePrefix: "page-",
    density: 180,
    quality: 92
  });

  return result.pageCount;
}

export type CreateEditionInput = {
  titre: string;
  datePublication: Date;
  type: EditionType;
  nombrePages: number;
  cheminInternePdf: string;
  cheminImageUne?: string | null;
  prix?: number | null;
  devise?: string | null;
  journalTypeId?: string | null;
};

/**
 * Crée une édition en base de données.
 */
export async function createEditionInDb(input: CreateEditionInput) {
  const edition = await prisma.edition.create({
    data: {
      titre: input.titre,
      datePublication: input.datePublication,
      type: input.type,
      nombrePages: input.nombrePages,
      cheminInternePdf: input.cheminInternePdf,
      cheminImageUne: input.cheminImageUne,
      prix: input.prix ?? null,
      devise: input.devise ?? null,
      journalTypeId: input.journalTypeId ?? null
    }
  });

  await prisma.systemEvent.create({
    data: {
      typeEvenement: "CREATION_EDITION",
      meta: {
        editionId: edition.id,
        titre: edition.titre
      }
    }
  });

  return edition;
}
