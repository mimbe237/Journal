#!/usr/bin/env node
/**
 * Reconvertit les pages PNG d'éditions en WebP et supprime les PNG après succès.
 * Usage : node scripts/convert-editions-to-webp.js
 *
 * S'appuie sur ImageMagick (magick/convert). Adapte WEBP_QUALITY via env si besoin.
 */
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const storageRoot = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
const editionsDir = path.join(storageRoot, "editions");
const quality = Number(process.env.WEBP_QUALITY ?? "82");

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

async function resolveBinary() {
  const env = {
    ...process.env,
    PATH: [
      "/opt/homebrew/bin",
      "/usr/local/bin",
      "/opt/local/bin",
      "/opt/local/lib/ImageMagick7/bin",
      process.env.PATH ?? ""
    ].join(":")
  };

  for (const binary of candidates) {
    try {
      await execFileAsync(binary, ["-version"], { env });
      return { binary, env };
    } catch {
      // try next
    }
  }
  throw new Error("Aucun binaire ImageMagick trouvé (magick/convert). Installez-le puis relancez.");
}

async function fileExists(p) {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function convertOne(pngPath, webpPath, runner) {
  const args = [
    pngPath,
    "-quality",
    String(quality),
    "-define",
    "webp:method=6",
    "-define",
    "webp:auto-filter=true",
    "-define",
    `webp:alpha-quality=${quality}`,
    "-strip",
    webpPath
  ];

  await execFileAsync(runner.binary, args, { env: runner.env });
}

async function main() {
  const runner = await resolveBinary();

  if (!(await fileExists(editionsDir))) {
    console.log(`Dossier éditions introuvable: ${editionsDir}`);
    return;
  }

  const editionIds = await fsp.readdir(editionsDir);
  let converted = 0;
  let removedAlreadyConverted = 0;
  let failures = 0;

  for (const editionId of editionIds) {
    const imagesDir = path.join(editionsDir, editionId, "images");
    if (!(await fileExists(imagesDir))) continue;

    const files = await fsp.readdir(imagesDir);
    const pngFiles = files.filter((f) => f.endsWith(".png") && f.startsWith("page-"));

    for (const file of pngFiles) {
      const pngPath = path.join(imagesDir, file);
      const webpPath = pngPath.replace(/\.png$/, ".webp");
      if (await fileExists(webpPath)) {
        // WebP déjà présent : on peut supprimer le PNG pour libérer l'espace
        try {
          await fsp.unlink(pngPath);
          removedAlreadyConverted += 1;
        } catch (err) {
          failures += 1;
          console.error(`\nSuppression du PNG échouée pour ${pngPath}:`, err?.message ?? err);
        }
        continue;
      }

      try {
        await convertOne(pngPath, webpPath, runner);
        await fsp.unlink(pngPath);
        converted += 1;
        process.stdout.write(".");
      } catch (err) {
        failures += 1;
        console.error(`\nConversion échouée pour ${pngPath}:`, err?.message ?? err);
      }
    }
  }

  console.log(
    `\nTerminé. Converties: ${converted}, PNG retirés (WebP existant): ${removedAlreadyConverted}, échecs: ${failures}. Qualité=${quality}.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
