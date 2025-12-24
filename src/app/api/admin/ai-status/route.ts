import { NextResponse } from "next/server";
import { isOpenAIConfigured } from "@/services/ai/openaiService";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ai-status
 * Returns the status of AI configuration
 */
export async function GET() {
  return NextResponse.json({
    openaiConfigured: isOpenAIConfigured(),
    features: {
      pdfExtraction: isOpenAIConfigured() ? 'ai' : 'heuristic'
    }
  });
}
