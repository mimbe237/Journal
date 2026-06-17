import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { extractWithAI, isOpenAIConfigured, AIExtractionResult } from '@/services/ai/openaiService';

// Configure worker for Node.js environment
// Disable worker loading in Node.js to prevent "fake worker" errors or file loading issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

interface ExtractedHeadline {
  title: string;
  page?: number;
  confidence?: number;
  category?: string;
  importance?: 'principal' | 'secondaire' | 'mineur';
}

interface ExtractionResult {
  headlines: ExtractedHeadline[];
  tags: string[];
  summary?: string;
  mainTopic?: string;
  method: 'ai' | 'heuristic';
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ECONOMIE: ["économie", "finance", "marché", "bourse", "entreprise", "business", "budget", "impôt", "banque", "commerce", "industrie", "pib", "croissance"],
  POLITIQUE: ["politique", "gouvernement", "ministre", "loi", "décret", "élection", "parlement", "diplomatie", "président", "état", "administration"],
  TECH: ["tech", "numérique", "digital", "innovation", "startup", "internet", "ia", "intelligence artificielle", "cybersécurité", "logiciel", "app", "télécom"],
  SOCIETE: ["société", "culture", "santé", "art", "musique", "cinéma", "livre", "religion", "justice", "fait divers", "social", "population", "femme", "jeunesse"],
  EDUCATION: ["éducation", "école", "université", "recherche", "formation", "enseignement", "étudiant", "académique", "pédagogie"],
  SPORT: ["sport", "football", "match", "coupe", "championnat", "athlète", "stade", "lion", "indomptable", "ligue"]
};

export class PdfExtractor {
  
  /**
   * Extracts headlines and tags from a PDF buffer.
   * Uses AI (OpenAI) if configured, otherwise falls back to heuristic extraction.
   */
  async extractMetadata(pdfBuffer: Buffer, forceHeuristic: boolean = false): Promise<ExtractionResult> {
    // First, extract raw text from PDF
    const { fullText, pageTexts } = await this.extractRawText(pdfBuffer);
    
    // If OpenAI is configured and not forced to use heuristic, use AI extraction
    if (!forceHeuristic && isOpenAIConfigured()) {
      try {
        console.log("🤖 Utilisation de l'IA pour l'extraction...");
        const aiResult = await extractWithAI(fullText);
        return {
          headlines: aiResult.headlines.map(h => ({
            title: h.title,
            category: h.category,
            importance: h.importance
          })),
          tags: aiResult.tags,
          summary: aiResult.summary,
          mainTopic: aiResult.mainTopic,
          method: 'ai'
        };
      } catch (error) {
        console.error("⚠️ Extraction IA échouée, fallback vers heuristique:", error);
        // Fall through to heuristic method
      }
    }
    
    // Fallback: Use heuristic extraction
    console.log("📐 Utilisation de l'extraction heuristique...");
    return this.extractWithHeuristics(pdfBuffer);
  }

  /**
   * Extracts raw text from all pages of the PDF
   */
  private async extractRawText(pdfBuffer: Buffer): Promise<{ fullText: string; pageTexts: string[] }> {
    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    
    const pageTexts: string[] = [];
    const numPages = doc.numPages;
    const limitPages = Math.min(numPages, 50); // Limit for performance
    
    for (let i = 1; i <= limitPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      pageTexts.push(pageText);
    }
    
    return {
      fullText: pageTexts.join("\n\n--- Page suivante ---\n\n"),
      pageTexts
    };
  }

  /**
   * Heuristic-based extraction (original method)
   */
  private async extractWithHeuristics(pdfBuffer: Buffer): Promise<ExtractionResult> {
    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    
    const headlines: ExtractedHeadline[] = [];
    const allText: string[] = [];

    const numPages = doc.numPages;
    
    // 1. First Pass: Look for "Sommaire" / "Table of Contents" in the first 5 pages
    let sommairePageNum = -1;
    
    for (let i = 1; i <= Math.min(numPages, 5); i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      
      if (/sommaire|au menu|dans ce num[ée]ro|table des mati[èe]res/i.test(pageText)) {
        sommairePageNum = i;
        // Extract from Sommaire
        const pageHeadlines = await this.extractFromSommairePage(page, i);
        headlines.push(...pageHeadlines);
        break; // Assume only one main sommaire
      }
    }

    // 2. Second Pass: If no Sommaire found (or to supplement), scan for Big Titles
    // We scan the whole document or a limit
    const limitPages = Math.min(numPages, 30); // Limit to 30 pages for performance
    
    for (let i = 1; i <= limitPages; i++) {
      if (i === sommairePageNum) continue; // Skip sommaire page

      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      
      // Calculate average font height to detect "Big" text
      let totalHeight = 0;
      let count = 0;
      const items = textContent.items as any[];
      
      items.forEach(item => {
        if (item.height) {
          totalHeight += item.height;
          count++;
        }
      });
      
      const avgHeight = count > 0 ? totalHeight / count : 10;
      const titleThreshold = avgHeight * 1.5; // Text 1.5x larger than average is a candidate

      // Group items by Y coordinate (lines)
      const lines: { y: number, text: string, height: number }[] = [];
      
      items.forEach(item => {
        if (!item.str.trim()) return;
        
        // Simple line grouping
        const existingLine = lines.find(l => Math.abs(l.y - item.transform[5]) < 5);
        if (existingLine) {
          existingLine.text += " " + item.str;
          existingLine.height = Math.max(existingLine.height, item.height);
        } else {
          lines.push({ y: item.transform[5], text: item.str, height: item.height });
        }
      });

      // Filter for titles
      lines.forEach(line => {
        // Clean text
        const cleanText = line.text.trim();
        if (cleanText.length > 10 && cleanText.length < 100 && line.height > titleThreshold) {
          // Exclude common headers/footers (often at very top or bottom)
          // PDF coords: 0,0 is bottom-left usually.
          // We can just use the text content heuristics
          if (!/journal|page|date|www/i.test(cleanText)) {
             // Avoid duplicates
             if (!headlines.find(h => h.title === cleanText)) {
               headlines.push({ title: cleanText, page: i, confidence: 0.6 });
             }
          }
        }
        allText.push(cleanText);
      });
    }

    // 3. Categorize Headlines
    headlines.forEach(h => {
      h.category = this.guessCategory(h.title);
    });

    // 4. Generate Tags from all text
    const tags = this.generateTags(allText.join(" "));

    // Sort headlines by page
    headlines.sort((a, b) => (a.page || 0) - (b.page || 0));

    return { headlines, tags, method: 'heuristic' };
  }

  private guessCategory(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(k => lowerText.includes(k))) {
        return category;
      }
    }
    return undefined;
  }

  private async extractFromSommairePage(page: any, pageNum: number): Promise<ExtractedHeadline[]> {
    const headlines: ExtractedHeadline[] = [];
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    // Group by line
    const lines: { y: number, text: string }[] = [];
    items.forEach(item => {
      if (!item.str.trim()) return;
      const existingLine = lines.find(l => Math.abs(l.y - item.transform[5]) < 5);
      if (existingLine) {
        existingLine.text += " " + item.str;
      } else {
        lines.push({ y: item.transform[5], text: item.str });
      }
    });

    // Look for "Title ..... Page" pattern
    // Regex for "Text ... 12" or "Text 12" at end of line
    const lineRegex = /^(.+?)(?:\.{2,}|[\s\t]+)(\d+)$/;

    lines.forEach(line => {
      const match = line.text.match(lineRegex);
      if (match) {
        const title = match[1].trim().replace(/\.+$/, ''); // Remove trailing dots
        const targetPage = parseInt(match[2], 10);
        
        if (title.length > 5 && !isNaN(targetPage)) {
           headlines.push({ title, page: targetPage, confidence: 0.9 });
        }
      }
    });

    return headlines;
  }

  private generateTags(fullText: string): string[] {
    const keywords = ["Économie", "Politique", "Tech", "Sport", "Culture", "Santé", "Éducation", "Finance", "Innovation", "Société", "International", "Afrique", "Cameroun"];
    const foundTags = new Set<string>();
    
    const lowerText = fullText.toLowerCase();
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundTags.add(keyword);
      }
    });

    // Add some dynamic extraction (most frequent capitalized words?)
    // For now, static list is safer.
    
    return Array.from(foundTags);
  }
}
