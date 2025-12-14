import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import sharp from "sharp";

export type PdfConversionResult = {
  imagesPaths: string[];
  pageCount: number;
};

type ConvertPdfParams = {
  pdfPath: string;
  outputDir: string;
  filenamePrefix?: string;
  density?: number;
  quality?: number;
};

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

  // Load PDF metadata to get page count
  const metadata = await sharp(resolvedPdfPath).metadata();
  const pageCount = metadata.pages || 0;

  if (pageCount === 0) {
    throw new Error("Impossible de lire le nombre de pages du PDF ou PDF vide.");
  }

  const imagesPaths: string[] = [];

  for (let i = 0; i < pageCount; i++) {
    const filename = `${prefix}${i + 1}.webp`;
    const absoluteOut = path.join(resolvedOutputDir, filename);

    // Convert page i to WebP
    await sharp(resolvedPdfPath, { page: i, density })
      .webp({ quality })
      .toFile(absoluteOut);

    imagesPaths.push(
      path.isAbsolute(params.outputDir) ? absoluteOut : path.join(params.outputDir, filename)
    );
  }

  return {
    imagesPaths,
    pageCount
  };
}
