import { prisma } from "@/lib/config/prisma";
import { TokenValues } from "./tokens";

// Types inline pour éviter problèmes de génération Prisma
type EmailTemplateWithLayout = {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  locale: string;
  category: string;
  sujet: string;
  corps: string;
  corpsText: string | null;
  status: string;
  layoutId: string | null;
  tokens: unknown;
  createdAt: Date;
  updatedAt: Date;
  layout: {
    id: string;
    nom: string;
    mjml: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

/**
 * Récupère un template par slug et locale.
 */
export async function getTemplateBySlug(
  slug: string,
  locale: string = "fr"
): Promise<EmailTemplateWithLayout | null> {
  return prisma.emailTemplate.findFirst({
    where: { slug, locale, status: "PUBLISHED" },
    include: { layout: true }
  }) as Promise<EmailTemplateWithLayout | null>;
}

/**
 * Récupère un template par ID.
 */
export async function getTemplateById(
  id: string
): Promise<EmailTemplateWithLayout | null> {
  return prisma.emailTemplate.findUnique({
    where: { id },
    include: { layout: true }
  }) as Promise<EmailTemplateWithLayout | null>;
}

/**
 * Remplace les tokens {{token}} dans une chaîne par les valeurs fournies.
 * Supporte les tokens imbriqués comme {{user.nom}}.
 */
export function replaceTokens(text: string, values: TokenValues): string {
  return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path: string) => {
    const keys = path.split(".");
    let value: unknown = values;
    for (const key of keys) {
      if (value == null || typeof value !== "object") {
        return match; // Token non résolu, on laisse tel quel
      }
      value = (value as Record<string, unknown>)[key];
    }
    if (value == null) return "";
    return String(value);
  });
}

/**
 * Convertit du MJML en HTML.
 * Note: nécessite le package mjml. Si non installé, retourne le corps tel quel (assume HTML).
 */
export async function mjmlToHtml(mjmlContent: string): Promise<string> {
  try {
    // Dynamic import pour éviter erreur si mjml n'est pas installé
    const moduleName = "mjml";
    const mjmlModule = await import(moduleName).catch(() => null);
    if (!mjmlModule || typeof mjmlModule.default !== "function") {
      return mjmlContent;
    }
    const result = mjmlModule.default(mjmlContent, { validationLevel: "soft" });
    return result.html;
  } catch {
    // MJML non installé ou erreur, on retourne tel quel (assume HTML)
    return mjmlContent;
  }
}

/**
 * Rend un template complet : layout + corps + tokens → HTML final.
 */
export async function renderTemplate(
  template: EmailTemplateWithLayout,
  values: TokenValues
): Promise<{ subject: string; html: string; text: string | null }> {
  // Résoudre les tokens dans le sujet
  const subject = replaceTokens(template.sujet, values);

  // Combiner layout et corps
  let fullMjml = template.corps;
  if (template.layout?.mjml) {
    // Le layout doit contenir un placeholder {{content}} pour le corps
    fullMjml = template.layout.mjml.replace("{{content}}", template.corps);
  }

  // Remplacer les tokens dans le corps
  const mjmlWithValues = replaceTokens(fullMjml, values);

  // Convertir MJML → HTML
  const html = await mjmlToHtml(mjmlWithValues);

  // Version texte
  const text = template.corpsText ? replaceTokens(template.corpsText, values) : null;

  return { subject, html, text };
}

/**
 * Rend un template par slug avec les valeurs fournies.
 */
export async function renderTemplateBySlug(
  slug: string,
  values: TokenValues,
  locale: string = "fr"
): Promise<{ subject: string; html: string; text: string | null } | null> {
  const template = await getTemplateBySlug(slug, locale);
  if (!template) return null;
  return renderTemplate(template, values);
}

/**
 * Injecte une bannière publicitaire dans le corps MJML d'un email.
 * Recherche le placeholder {{ad.slot}} ou l'insère avant la fermeture </mj-body>.
 * 
 * @param mjmlContent - Le contenu MJML du template
 * @param adMjml - Le snippet MJML de la publicité (ou null si pas de pub)
 * @returns Le contenu MJML avec la pub injectée
 */
export function injectAdIntoMjml(mjmlContent: string, adMjml: string | null): string {
  if (!adMjml) {
    // Supprimer le placeholder si pas de pub
    return mjmlContent.replace(/\{\{ad\.slot\}\}/g, "");
  }

  // Chercher le placeholder explicite
  if (mjmlContent.includes("{{ad.slot}}")) {
    return mjmlContent.replace("{{ad.slot}}", adMjml);
  }

  // Sinon, insérer avant </mj-body>
  const closingTag = "</mj-body>";
  const insertIndex = mjmlContent.lastIndexOf(closingTag);
  if (insertIndex === -1) {
    // Pas de structure MJML standard, ajouter à la fin
    return mjmlContent + "\n" + adMjml;
  }

  return (
    mjmlContent.slice(0, insertIndex) +
    "\n" +
    adMjml +
    "\n" +
    mjmlContent.slice(insertIndex)
  );
}

/**
 * Injecte une bannière publicitaire dans le corps HTML d'un email.
 * Recherche le placeholder {{ad.slot}} ou l'insère avant </body>.
 */
export function injectAdIntoHtml(htmlContent: string, adHtml: string | null): string {
  if (!adHtml) {
    return htmlContent.replace(/\{\{ad\.slot\}\}/g, "");
  }

  if (htmlContent.includes("{{ad.slot}}")) {
    return htmlContent.replace("{{ad.slot}}", adHtml);
  }

  // Insérer avant </body>
  const closingTag = "</body>";
  const insertIndex = htmlContent.lastIndexOf(closingTag);
  if (insertIndex === -1) {
    return htmlContent + "\n" + adHtml;
  }

  return (
    htmlContent.slice(0, insertIndex) +
    "\n" +
    adHtml +
    "\n" +
    htmlContent.slice(insertIndex)
  );
}

/**
 * Rend un template avec injection de publicité.
 * Combine le rendu standard avec l'insertion d'une bannière ciblée.
 */
export async function renderTemplateWithAd(
  template: EmailTemplateWithLayout,
  values: TokenValues,
  adMjml: string | null,
  adHtml: string | null
): Promise<{ subject: string; html: string; text: string | null }> {
  // Résoudre les tokens dans le sujet
  const subject = replaceTokens(template.sujet, values);

  // Combiner layout et corps
  let fullMjml = template.corps;
  if (template.layout?.mjml) {
    fullMjml = template.layout.mjml.replace("{{content}}", template.corps);
  }

  // Injecter la pub dans le MJML
  fullMjml = injectAdIntoMjml(fullMjml, adMjml);

  // Remplacer les tokens dans le corps
  const mjmlWithValues = replaceTokens(fullMjml, values);

  // Convertir MJML → HTML
  let html = await mjmlToHtml(mjmlWithValues);

  // Si la conversion MJML a échoué et qu'on a du HTML brut, injecter la pub HTML
  if (html === mjmlWithValues && adHtml) {
    html = injectAdIntoHtml(html, adHtml);
  }

  // Version texte
  const text = template.corpsText ? replaceTokens(template.corpsText, values) : null;

  return { subject, html, text };
}

