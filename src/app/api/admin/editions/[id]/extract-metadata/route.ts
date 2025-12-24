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
  const startTime = Date.now();
  let stepInfo = "init";
  
  try {
    stepInfo = "auth";
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);
    const { id } = await params;
    
    // Check if force heuristic mode is requested
    const { searchParams } = new URL(req.url);
    const forceHeuristic = searchParams.get("mode") === "heuristic";

    stepInfo = "fetch-edition";
    const edition = await prisma.edition.findUnique({
      where: { id },
    });

    if (!edition || !edition.cheminInternePdf) {
      return NextResponse.json({ error: "Édition ou PDF introuvable" }, { status: 404 });
    }

    console.log(`[extract-metadata] Edition: ${id}, PDF path: ${edition.cheminInternePdf?.substring(0, 100)}...`);

    let pdfBuffer: Buffer;
    stepInfo = "load-pdf";

    // Determine if local file or URL
    if (edition.cheminInternePdf.startsWith("http")) {
      // Fetch from URL (S3/R2)
      console.log(`[extract-metadata] Fetching PDF from URL...`);
      const res = await fetch(edition.cheminInternePdf);
      if (!res.ok) {
        throw new Error(`Impossible de télécharger le PDF: ${res.status} ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
      console.log(`[extract-metadata] PDF downloaded: ${pdfBuffer.length} bytes`);
    } else {
      // Local file
      console.log(`[extract-metadata] Loading local PDF...`);
      let filePath = edition.cheminInternePdf;
      
      try {
        await fs.access(filePath);
      } catch {
        filePath = path.join(process.cwd(), edition.cheminInternePdf);
        try {
           await fs.access(filePath);
        } catch {
           filePath = path.join(process.cwd(), "storage", edition.cheminInternePdf);
        }
      }
      
      pdfBuffer = await fs.readFile(filePath);
      console.log(`[extract-metadata] PDF loaded from ${filePath}: ${pdfBuffer.length} bytes`);
    }

    stepInfo = "extract";
    console.log(`[extract-metadata] Starting extraction (AI: ${isOpenAIConfigured()}, forceHeuristic: ${forceHeuristic})...`);
    
    const extractor = new PdfExtractor();
    const result = await extractor.extractMetadata(pdfBuffer, forceHeuristic);

    const duration = Date.now() - startTime;
    console.log(`[extract-metadata] Extraction complete in ${duration}ms. Headlines: ${result.headlines.length}, Tags: ${result.tags.length}`);

    return NextResponse.json({
      ...result,
      aiEnabled: isOpenAIConfigured(),
      editionId: id,
      duration
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[extract-metadata] Error at step "${stepInfo}" after ${duration}ms:`, error);
    return NextResponse.json({ 
      error: error.message || "Erreur d'extraction",
      details: error.toString(),
      step: stepInfo,
      aiEnabled: isOpenAIConfigured(),
      duration
    }, { status: 500 });
  }
}
