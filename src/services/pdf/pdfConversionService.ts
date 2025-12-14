import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import sharp from "sharp";

export type PdfConversionResult = {
  imagesPaths: string[]; // chemins vers les images générées (relatifs si outputDir est relatif)
  pageCount: number;
};

type ConvertPdfParams = {
  pdfPath: string; // chemin du PDF (relatif au storage root ou absolu)
  outputDir: string; // dossier cible (relatif au storage root ou absolu)
  filenamePrefix?: string; // ex: page-
  density?: number; // résolution de rendu (dpi)
  quality?: number; // qualité WebP
};

/**
 * Convertit un PDF en WebP sans dépendance système (ImageMagick).
 * S'appuie sur sharp/libvips, compatible avec l'environnement serverless Vercel.
 */
export async function convertPdfToImages(params: ConvertPdfParams): Promise<PdfConversionResult> {
  const storageRoot = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
  const prefix = params.filenamePrefix ?? "page-";
  const density = params.density ?? 180;
  const quality = params.quality ?? 92;

  const resolvedPdfPath = path.isAbsolute(params.pdfPath)
    ? params.pdfPath
    : path.join(storageRoot, params.pdfPath);
  const resolvedOutputDir = path.isAbsolute(params.outputDir)
    ? params.outputDir
    : path.join(storageRoot, params.outputDir);

  if (!fs.existsSync(resolvedPdfPath)) {
    throw new Error(`PDF introuvable: ${resolvedPdfPath}`);
  }

  await fsp.mkdir(resolvedOutputDir, { recursive: true });

  // Récupération du nombre de pages du PDF
  const meta = await sharp(resolvedPdfPath, { density }).metadata();
  const pageCount = meta.pages ?? 1;

  const imagesPaths: string[] = [];

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const filename = `${prefix}${pageIndex + 1}.webp`;
    const absoluteOut = path.join(resolvedOutputDir, filename);

    await sharp(resolvedPdfPath, { density, page: pageIndex })
      .webp({ quality })
      .toFile(absoluteOut);

    // Si outputDir est relatif, on renvoie un chemin relatif cohérent avec l'entrée
    imagesPaths.push(
      path.isAbsolute(params.outputDir) ? absoluteOut : path.join(params.outputDir, filename)
    );
  }

  return {
    imagesPaths,
    pageCount
  };
}
