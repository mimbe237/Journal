import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";
import { PdfExtractor } from "@/lib/pdf/pdfExtractor";
import { isOpenAIConfigured } from "@/services/ai/openaiService";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for AI extraction

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
    const { id } = await params;
    
    // Check if force heuristic mode is requested
    const { searchParams } = new URL(req.url);
    const forceHeuristic = searchParams.get("mode") === "heuristic";

    const edition = await prisma.edition.findUnique({
      where: { id },
    });

    if (!edition || !edition.cheminInternePdf) {
      return NextResponse.json({ error: "Édition ou PDF introuvable" }, { status: 404 });
    }

    let pdfBuffer: Buffer;

    // Determine if local file or URL
    if (edition.cheminInternePdf.startsWith("http")) {
      // Fetch from URL
      const res = await fetch(edition.cheminInternePdf);
      if (!res.ok) throw new Error("Impossible de télécharger le PDF");
      const arrayBuffer = await res.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } else {
      // Local file
      // Try to resolve path. It might be relative to storage root or absolute
      let filePath = edition.cheminInternePdf;
      
      // If it doesn't start with /, assume it's in storage/editions (based on previous context)
      // But let's check if it exists as is first
      try {
        await fs.access(filePath);
      } catch {
        // Try relative to project root
        filePath = path.join(process.cwd(), edition.cheminInternePdf);
        try {
           await fs.access(filePath);
        } catch {
           // Try relative to storage
           filePath = path.join(process.cwd(), "storage", edition.cheminInternePdf);
        }
      }
      
      pdfBuffer = await fs.readFile(filePath);
    }

    const extractor = new PdfExtractor();
    const result = await extractor.extractMetadata(pdfBuffer, forceHeuristic);

    return NextResponse.json({
      ...result,
      aiEnabled: isOpenAIConfigured(),
      editionId: id
    });

  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ 
      error: error.message || "Erreur d'extraction",
      details: error.toString(),
      aiEnabled: isOpenAIConfigured()
    }, { status: 500 });
  }
}
}
