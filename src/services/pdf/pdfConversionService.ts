import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import sharp from "sharp";
import { createCanvas } from "canvas";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

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
  const scale = density / 72;
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

  const pdfBuffer = await fsp.readFile(resolvedPdfPath);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true,
    verbosity: 0
  });

  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;
  const imagesPaths: string[] = [];

  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
    const page = await pdfDocument.getPage(pageIndex);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context as any,
      viewport: viewport,
    } as any).promise;

    const buffer = canvas.toBuffer("image/png");

    const filename = `${prefix}${pageIndex}.webp`;
    const absoluteOut = path.join(resolvedOutputDir, filename);

    await sharp(buffer)
      .webp({ quality })
      .toFile(absoluteOut);

    page.cleanup();

    imagesPaths.push(
      path.isAbsolute(params.outputDir) ? absoluteOut : path.join(params.outputDir, filename)
    );
  }

  return {
    imagesPaths,
    pageCount
  };
}
