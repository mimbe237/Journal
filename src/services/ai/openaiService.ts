import OpenAI from 'openai';

// Lazy initialization to avoid errors when API key is not set
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY n'est pas configurée dans les variables d'environnement");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface ExtractedHeadline {
  title: string;
  page?: number;
  category?: string;
  importance: 'principal' | 'secondaire' | 'mineur';
}

export interface AIExtractionResult {
  headlines: ExtractedHeadline[];
  tags: string[];
  summary?: string;
  mainTopic?: string;
}

const EXTRACTION_SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de journaux et magazines africains, particulièrement camerounais.
Ton rôle est d'extraire les informations clés d'un texte de journal :
1. Les TITRES PRINCIPAUX (grands titres de Une et titres d'articles majeurs)
2. Les TITRES SECONDAIRES (sous-titres, titres de rubriques)
3. Les TAGS/MOTS-CLÉS pertinents pour la recherche et la catégorisation

Pour les catégories, utilise ces valeurs :
- ECONOMIE : économie, finance, business, marché
- POLITIQUE : politique, gouvernement, élections, diplomatie
- TECH : technologie, numérique, innovation, startups
- SOCIETE : société, culture, faits divers, santé
- EDUCATION : éducation, recherche, formation
- SPORT : sport, football, compétitions

Réponds UNIQUEMENT en JSON valide, sans texte autour.`;

const EXTRACTION_USER_PROMPT = `Analyse ce texte extrait d'un journal/magazine et extrais les informations structurées.

TEXTE DU JOURNAL :
---
{TEXT}
---

Réponds avec ce format JSON exact :
{
  "headlines": [
    {
      "title": "Le titre exact tel qu'il apparaît",
      "category": "ECONOMIE|POLITIQUE|TECH|SOCIETE|EDUCATION|SPORT",
      "importance": "principal|secondaire|mineur"
    }
  ],
  "tags": ["tag1", "tag2", "tag3", ...],
  "summary": "Résumé en 1-2 phrases du contenu global",
  "mainTopic": "Le sujet principal de cette édition"
}

Règles :
- Extrais entre 5 et 15 titres principaux/secondaires
- Génère entre 10 et 20 tags pertinents
- Les tags doivent être en minuscules, sans accents pour la recherche
- Privilégie les titres réels du journal, pas tes interprétations`;

/**
 * Extracts headlines and tags from PDF text using OpenAI GPT
 */
export async function extractWithAI(pdfText: string): Promise<AIExtractionResult> {
  const client = getOpenAIClient();
  
  // Truncate text if too long (GPT-4 turbo can handle ~128k tokens, but we limit for cost)
  const maxChars = 50000; // ~12k tokens
  const truncatedText = pdfText.length > maxChars 
    ? pdfText.substring(0, maxChars) + "\n\n[... texte tronqué pour l'analyse ...]"
    : pdfText;

  const userPrompt = EXTRACTION_USER_PROMPT.replace('{TEXT}', truncatedText);

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective and fast
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Low temperature for consistent extraction
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Réponse vide de l'IA");
    }

    const result = JSON.parse(content) as AIExtractionResult;
    
    // Validate and sanitize the result
    return {
      headlines: (result.headlines || []).map(h => ({
        title: h.title?.trim() || '',
        category: h.category,
        importance: h.importance || 'secondaire'
      })).filter(h => h.title.length > 0),
      tags: (result.tags || [])
        .map(t => t.toLowerCase().trim())
        .filter(t => t.length > 1),
      summary: result.summary,
      mainTopic: result.mainTopic
    };

  } catch (error: any) {
    console.error("Erreur extraction IA:", error);
    
    if (error.code === 'insufficient_quota') {
      throw new Error("Quota OpenAI épuisé. Veuillez vérifier votre compte.");
    }
    if (error.code === 'invalid_api_key') {
      throw new Error("Clé API OpenAI invalide.");
    }
    
    throw new Error(`Erreur IA: ${error.message}`);
  }
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
