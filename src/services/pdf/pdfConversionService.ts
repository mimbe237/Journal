import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import sharp from "sharp";
import { createRequire } from "module";
// Load canvas first so we can polyfill DOMMatrix before loading pdfjs
// @ts-ignore
import { createCanvas, DOMMatrix as CanvasDOMMatrix } from "canvas";
// @ts-ignore
import { ImageData as CanvasImageData } from "canvas";

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
  // Ensure DOMMatrix exists for pdfjs in Node.js
  const g: any = globalThis as any;
  if (typeof g.DOMMatrix === "undefined" && typeof CanvasDOMMatrix !== "undefined") {
    g.DOMMatrix = CanvasDOMMatrix as any;
  }
  if (typeof g.ImageData === "undefined" && typeof CanvasImageData !== "undefined") {
    g.ImageData = CanvasImageData as any;
  }

  // Ensure canvas is available
  if (typeof createCanvas !== 'function') {
    throw new Error("Canvas is not installed or failed to load. Cannot convert PDF.");
  }

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

  // Read PDF file
  const pdfBuffer = await fsp.readFile(resolvedPdfPath);
  const data = new Uint8Array(pdfBuffer);

  const requireModule = createRequire(import.meta.url);
  const pdfjsLib: any = requireModule("pdfjs-dist/legacy/build/pdf.js");

  // Disable workers for Node environment to avoid bundle lookups
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
    pdfjsLib.GlobalWorkerOptions.workerPort = null;
  }

  const loadingTask = pdfjsLib.getDocument({
    data,
    disableWorker: true,
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;
  const imagesPaths: string[] = [];

  const canvasFactory = {
    create(width: number, height: number, _contextType?: string) {
      const canvas = createCanvas(width, height);
      // pdfjs peut appeler sans préciser "2d" -> on force "2d" pour éviter un contexte nul
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Impossible d'initialiser le contexte 2d pour le rendu PDF");
      }
      // Polyfill createImageData if missing
      if (!context.createImageData) {
        (context as any).createImageData = (width: number, height: number) => new ImageData(width, height);
      }
      return { canvas, context };
    },
    reset(ctx: any, width: number, height: number) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
    },
    destroy(ctx: any) {
      ctx.canvas.width = 0;
      ctx.canvas.height = 0;
      ctx.canvas = null;
      ctx.context = null;
    },
  };

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdfDocument.getPage(i);
    
    // Calculate scale based on density (72 DPI is default scale 1)
    const scale = density / 72;
    const viewport = page.getViewport({ scale });

    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height, "2d");
    const renderContext = {
      canvasContext: canvasAndContext.context,
      viewport: viewport,
      canvasFactory: canvasFactory,
      canvas: canvasAndContext.canvas,
    } as any;

    await page.render(renderContext).promise;

    // Convert canvas to buffer (PNG)
    const buffer = canvasAndContext.canvas.toBuffer("image/png");
    
    const filename = `${prefix}${i}.webp`;
    const absoluteOut = path.join(resolvedOutputDir, filename);

    // Convert PNG buffer to WebP using Sharp
    await sharp(buffer)
      .webp({ quality })
      .toFile(absoluteOut);

    imagesPaths.push(
      path.isAbsolute(params.outputDir) ? absoluteOut : path.join(params.outputDir, filename)
    );

    // Cleanup
    page.cleanup();
  }

  return {
    imagesPaths,
    pageCount
  };
}
