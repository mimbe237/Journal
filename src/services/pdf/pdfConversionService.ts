import path from "path";
import fs from "fs/promises";

// TODO: Brancher une librairie de conversion PDF->images (pdf-poppler, pdf2pic, pdftoppm, etc.).
// L'implémentation actuelle est un stub qui décrit le flux attendu.

export type PdfConversionResult = {
  imagesPaths: string[]; // chemins relatifs vers les images générées
  pageCount: number;
};

export async function convertPdfToImages(params: {
  pdfPath: string; // chemin local du PDF
  outputDir: string; // dossier cible (relatif au storage provider)
  filenamePrefix?: string; // ex: page-
}): Promise<PdfConversionResult> {
  const prefix = params.filenamePrefix ?? "page-";

  // Pseudo-code (à remplacer par l'appel réel à la librairie choisie) :
  // 1) S'assurer que outputDir existe (géré côté storage).
  // 2) Appeler la conversion PDF -> images (png/jpg) en écrivant dans outputDir.
  // 3) Retourner la liste triée des chemins d'images et le nombre de pages.
  // Exemple avec pdftoppm :
  // const cmd = `pdftoppm -png "${params.pdfPath}" "${path.join(outputDir, prefix)}"`;
  // exec(cmd) ...

  // Stub : aucune conversion réelle, on indique un TODO.
  // Pour éviter un flux cassé, on génère une page unique fictive (PNG transparent 1x1).
  const fakeImageName = `${prefix}1.png`;
  const fakeFullPath = path.join(params.outputDir, fakeImageName);
  const storageRoot = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
  const absPath = path.join(storageRoot, fakeFullPath);
  await fs.mkdir(path.dirname(absPath), { recursive: true });
  const transparent1x1Png = Buffer.from(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
      "1f15c4890000000a49444154789c6360000002000154010a0d0a000000" +
      "0049454e44ae426082",
    "hex"
  );
  await fs.writeFile(absPath, transparent1x1Png);

  return {
    imagesPaths: [fakeFullPath],
    pageCount: 1
  };
}
