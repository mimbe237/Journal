import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { prisma } from "@/lib/config/prisma";
// Avoid importing Prisma enum to keep types simple here
type EditionType = any;

const execFileAsync = promisify(execFile);

/**
 * Convertit un PDF en images WebP (une par page).
 * Utilise ImageMagick (convert/magick).
 */
export async function convertPdfToImages(pdfPath: string, outputDir: string): Promise<number> {
  const resolvedPdfPath = path.resolve(pdfPath);
  const resolvedOutputDir = path.resolve(outputDir);
  const outPattern = `${resolvedOutputDir}/page-%d.webp`;

  if (!fs.existsSync(resolvedPdfPath)) {
    throw new Error(`PDF not found: ${resolvedPdfPath}`);
  }

  fs.mkdirSync(resolvedOutputDir, { recursive: true });

  try {
    const density = 180;
    const quality = 92;
    const extraPath = ["/opt/homebrew/bin", "/usr/local/bin", "/opt/local/bin", "/opt/local/lib/ImageMagick7/bin"]
      .filter(Boolean)
      .join(":");
    const env = { ...process.env, PATH: `${extraPath}:${process.env.PATH ?? ""}` };
    // Try common install locations first, then rely on PATH resolution
    const candidates = [
      "/opt/local/lib/ImageMagick7/bin/magick",
      "/opt/homebrew/bin/magick",
      "/usr/local/bin/magick",
      "magick",
      "/opt/local/bin/convert",
      "/opt/homebrew/bin/convert",
      "/usr/local/bin/convert",
      "convert"
    ];

    let lastErr: string | null = null;
    let success = false;
    const attempted: string[] = [];

    for (const binary of candidates) {
      // Skip non-existent absolute paths to reduce noisy errors
      if (path.isAbsolute(binary) && !fs.existsSync(binary)) continue;

      const args = [
        "-density",
        String(density),
        resolvedPdfPath,
        "-quality",
        String(quality),
        "-define",
        "webp:method=6",
        "-define",
        "webp:auto-filter=true",
        "-define",
        `webp:alpha-quality=${quality}`,
        "-strip",
        "-scene",
        "1",
        outPattern
      ];

      attempted.push([binary, ...args].join(" "));

      try {
        await execFileAsync(binary, args, { env });
        success = true;
        break;
      } catch (error: any) {
        const stdErr = error?.stderr?.toString()?.trim();
        lastErr = stdErr || error?.message || String(error);
      }
    }

    if (!success) {
      const hint = "Installez ImageMagick + Ghostscript (ex: brew install imagemagick ghostscript).";
      throw new Error(
        `ImageMagick conversion failed. Checked commands:\n${attempted.join(
          "\n"
        )}\n${hint}\nLast error: ${lastErr ?? "unknown"}`
      );
    }
  } catch (error: any) {
    throw new Error(`ImageMagick conversion failed: ${error?.message ?? error}`);
  }

  // Compter les fichiers créés
  const files = fs.readdirSync(resolvedOutputDir).filter((f) => f.endsWith(".webp"));
  return files.length;
}

export type CreateEditionInput = {
  titre: string;
  datePublication: Date;
  type: EditionType;
  nombrePages: number;
  cheminInternePdf: string;
  cheminImageUne?: string | null;
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
      cheminImageUne: input.cheminImageUne
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
