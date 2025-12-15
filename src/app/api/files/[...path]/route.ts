import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { fileStorageProvider } from "@/services/fileStorage";
import { reportError } from "@/lib/observability/errorReporter";

export const runtime = "nodejs";

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
  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
  }

  const requested = pathSegments.join("/");
  const requestedExt = path.extname(requested).toLowerCase();
  const candidatePaths: string[] = [requested];

  // Fallback : si un PNG est demandé mais absent, essayer la version WebP
  if (requestedExt === ".png") {
    candidatePaths.push(requested.replace(/\.png$/i, ".webp"));
  }

  for (const candidate of candidatePaths) {
    try {
      const stream = await fileStorageProvider.getFileStream({ path: candidate });
      const ext = path.extname(candidate).toLowerCase() || requestedExt;
      const contentType = mimeMap[ext] || "application/octet-stream";

      const chunks: Buffer[] = [];
      for await (const chunk of stream as any as AsyncIterable<Buffer | Uint8Array | string>) {
        if (typeof chunk === "string") {
          chunks.push(Buffer.from(chunk));
        } else {
          chunks.push(Buffer.from(chunk));
        }
      }

      const data = Buffer.concat(chunks);

      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600"
        }
      });
    } catch (error: any) {
      const message = (error?.message || "").toLowerCase();
      const isNotFound =
        error?.name === "NotFound" ||
        error?.$metadata?.httpStatusCode === 404 ||
        message.includes("no such file") ||
        message.includes("not exist") ||
        message.includes("enoent") ||
        message.includes("not found");

      if (!isNotFound) {
        console.error("[files] error while streaming", candidate, error);
        await reportError({
          message: "File streaming failed",
          error,
          context: {
            candidate
          }
        });
        return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
      }
      // Not found -> essayer le candidat suivant
    }
  }

  return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
}
