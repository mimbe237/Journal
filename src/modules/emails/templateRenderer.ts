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

