import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const mimeMap: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf"
};

// Minimal file-serving endpoint for private storage (images de une, etc.).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const storageRoot = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
  const requested = pathSegments.join("/");
  const resolvedPath = path.resolve(storageRoot, requested);

  // Sécurité : interdiction de sortir du dossier de stockage.
  if (!resolvedPath.startsWith(path.resolve(storageRoot))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let finalPath = resolvedPath;
  let finalExt = path.extname(resolvedPath).toLowerCase();

  // Fallback : si un PNG est demandé mais absent, servir la version WebP si disponible
  if (!fs.existsSync(finalPath) && finalExt === ".png") {
    const webpPath = resolvedPath.replace(/\.png$/i, ".webp");
    if (fs.existsSync(webpPath) && fs.statSync(webpPath).isFile()) {
      finalPath = webpPath;
      finalExt = ".webp";
    }
  }

  if (!fs.existsSync(finalPath) || !fs.statSync(finalPath).isFile()) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  const data = await fs.promises.readFile(finalPath);
  const contentType = mimeMap[finalExt] || "application/octet-stream";

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600"
    }
  });
}
