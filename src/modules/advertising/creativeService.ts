/**
 * Service de gestion des créatifs publicitaires
 */

import { prisma } from "@/lib/config/prisma";
import { AdChannel } from "@prisma/client";

// Types
export type CreateCreativeInput = {
  campaignId: string;
  nom: string;
  imageUrl: string;
  clickUrl: string;
  altText?: string;
  mjmlSnippet?: string;
  htmlSnippet?: string;
  width?: number;
  height?: number;
};

export type UpdateCreativeInput = Partial<Omit<CreateCreativeInput, "campaignId">> & {
  isActive?: boolean;
};

export type AdTemplateVariant =
  | "EMAIL_FULL_WIDTH"
  | "EMAIL_SPONSOR_CARD"
  | "IN_APP_BANNER"
  | "SIDEBAR_RECTANGLE";

type TemplateBuildParams = {
  imageUrl: string;
  clickUrl: string;
  altText?: string;
  advertiserName?: string;
  campaignName?: string;
  tagline?: string;
};

type AdTemplateDefinition = {
  variant: AdTemplateVariant;
  label: string;
  description: string;
  recommended: { width?: number; height?: number; channels: AdChannel[] };
  buildMjml: (params: TemplateBuildParams) => string;
  buildHtml: (params: TemplateBuildParams) => string;
};

const DEFAULT_CREATIVE_TEMPLATES: AdTemplateDefinition[] = [
  {
    variant: "EMAIL_FULL_WIDTH",
    label: "Bannière email (600x200)",
    description: "Slot principal dans l'édition email, image pleine largeur.",
    recommended: { width: 600, height: 200, channels: [AdChannel.EMAIL_EDITION] },
    buildMjml: ({ imageUrl, clickUrl, altText }) => `
<mj-section padding="0 0 16px 0">
  <mj-column>
    <mj-image 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      href="${clickUrl}"
      padding="0"
      border-radius="12px"
    />
    <mj-text align="center" font-size="10px" color="#6c757d" padding-top="8px">
      Publicité
    </mj-text>
  </mj-column>
</mj-section>
    `.trim(),
    buildHtml: ({ imageUrl, clickUrl, altText }) => `
<div style="text-align: center; padding: 0 0 16px 0;">
  <a href="${clickUrl}" target="_blank" rel="noopener noreferrer">
    <img 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      style="max-width: 100%; height: auto; border-radius: 12px; border: 0;"
    />
  </a>
  <p style="font-size: 10px; color: #6c757d; margin-top: 8px;">Publicité</p>
</div>
    `.trim(),
  },
  {
    variant: "EMAIL_SPONSOR_CARD",
    label: "Cartouche sponsor (email)",
    description: "Bloc sponsor avec mention annonceur + CTA.",
    recommended: { width: 600, height: 220, channels: [AdChannel.EMAIL_EDITION] },
    buildMjml: ({ imageUrl, clickUrl, altText, advertiserName, tagline }) => `
<mj-section padding="16px" background-color="#f8fafc" border-radius="12px">
  <mj-column>
    <mj-text font-size="12px" color="#64748b" padding-bottom="8px" align="center">
      Sponsor : ${advertiserName || "Annonceur"}
    </mj-text>
    <mj-image 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      href="${clickUrl}"
      padding="0"
      border-radius="10px"
    />
    <mj-text align="center" font-size="14px" color="#0f172a" padding-top="10px" padding-bottom="4px">
      ${tagline || "Découvrez l'offre du jour"}
    </mj-text>
    <mj-button href="${clickUrl}" background-color="#0ea5e9" color="#ffffff" font-size="14px" padding="6px 0" border-radius="8px">
      En savoir plus
    </mj-button>
  </mj-column>
</mj-section>
    `.trim(),
    buildHtml: ({ imageUrl, clickUrl, altText, advertiserName, tagline }) => `
<div style="padding:16px; background:#f8fafc; border-radius:12px; text-align:center;">
  <div style="font-size:12px; color:#64748b; margin-bottom:8px;">Sponsor : ${advertiserName || "Annonceur"}</div>
  <a href="${clickUrl}" target="_blank" rel="noopener noreferrer" style="display:block;">
    <img 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      style="max-width:100%; height:auto; border-radius:10px; border:0;"
    />
  </a>
  <div style="font-size:14px; color:#0f172a; margin:10px 0 4px;">${tagline || "Découvrez l'offre du jour"}</div>
  <a href="${clickUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#0ea5e9; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600;">
    En savoir plus
  </a>
  <div style="font-size:10px; color:#94a3b8; margin-top:8px;">Publicité</div>
</div>
    `.trim(),
  },
  {
    variant: "IN_APP_BANNER",
    label: "Bannière in-app (320x100)",
    description: "Bannière légère pour l'espace abonné.",
    recommended: { width: 320, height: 100, channels: [AdChannel.IN_APP_BANNER] },
    buildMjml: ({ imageUrl, clickUrl, altText }) => `
<mj-section padding="10px 0">
  <mj-column>
    <mj-image 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      href="${clickUrl}"
      padding="0"
      width="320px"
      height="100px"
      border-radius="8px"
    />
  </mj-column>
</mj-section>
    `.trim(),
    buildHtml: ({ imageUrl, clickUrl, altText }) => `
<div style="text-align:center; padding:10px 0;">
  <a href="${clickUrl}" target="_blank" rel="noopener noreferrer">
    <img 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      style="width:320px; max-width:100%; height:auto; border-radius:8px; border:0;"
    />
  </a>
</div>
    `.trim(),
  },
  {
    variant: "SIDEBAR_RECTANGLE",
    label: "Rectangle latéral (300x250)",
    description: "Format classique pour colonnes latérales.",
    recommended: { width: 300, height: 250, channels: [AdChannel.IN_APP_BANNER, AdChannel.EMAIL_EDITION] },
    buildMjml: ({ imageUrl, clickUrl, altText }) => `
<mj-section padding="0 0 16px 0">
  <mj-column>
    <mj-image 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      href="${clickUrl}"
      padding="0"
      width="300px"
      height="250px"
      border-radius="10px"
    />
    <mj-text align="center" font-size="10px" color="#94a3b8" padding-top="6px">
      Publicité
    </mj-text>
  </mj-column>
</mj-section>
    `.trim(),
    buildHtml: ({ imageUrl, clickUrl, altText }) => `
<div style="text-align:center; padding:0 0 16px 0;">
  <a href="${clickUrl}" target="_blank" rel="noopener noreferrer">
    <img 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      width="300" 
      height="250"
      style="max-width:100%; height:auto; border-radius:10px; border:0;"
    />
  </a>
  <div style="font-size:10px; color:#94a3b8; margin-top:6px;">Publicité</div>
</div>
    `.trim(),
  },
];

function findTemplate(variant: AdTemplateVariant): AdTemplateDefinition | undefined {
  return DEFAULT_CREATIVE_TEMPLATES.find((t) => t.variant === variant);
}

/**
 * Liste les templates par défaut disponibles (métadonnées uniquement).
 */
export function listDefaultCreativeTemplates() {
  return DEFAULT_CREATIVE_TEMPLATES.map(({ variant, label, description, recommended }) => ({
    variant,
    label,
    description,
    recommended,
  }));
}

/**
 * Génère les snippets MJML/HTML à partir d'un template par défaut.
 * Permet de préremplir un créatif tout en restant modifiable côté admin.
 */
export function buildCreativeSnippetsFromTemplate(
  options: TemplateBuildParams & { variant: AdTemplateVariant }
): { mjmlSnippet: string; htmlSnippet: string } {
  const template = findTemplate(options.variant);

  if (!template) {
    return {
      mjmlSnippet: generateDefaultMjmlSnippet(options.imageUrl, options.clickUrl, options.altText),
      htmlSnippet: generateDefaultHtmlSnippet(options.imageUrl, options.clickUrl, options.altText),
    };
  }

  return {
    mjmlSnippet: template.buildMjml(options),
    htmlSnippet: template.buildHtml(options),
  };
}

/**
 * Crée un nouveau créatif.
 */
export async function createCreative(input: CreateCreativeInput) {
  return prisma.adCreative.create({
    data: {
      campaignId: input.campaignId,
      nom: input.nom,
      imageUrl: input.imageUrl,
      clickUrl: input.clickUrl,
      altText: input.altText,
      mjmlSnippet: input.mjmlSnippet,
      htmlSnippet: input.htmlSnippet,
      width: input.width,
      height: input.height,
    },
    include: {
      campaign: true,
    },
  });
}

/**
 * Met à jour un créatif.
 */
export async function updateCreative(id: string, input: UpdateCreativeInput) {
  return prisma.adCreative.update({
    where: { id },
    data: input,
    include: {
      campaign: true,
    },
  });
}

/**
 * Récupère un créatif par son ID.
 */
export async function getCreativeById(id: string) {
  return prisma.adCreative.findUnique({
    where: { id },
    include: {
      campaign: { include: { advertiser: true } },
      _count: {
        select: { impressions: true, clicks: true },
      },
    },
  });
}

/**
 * Liste les créatifs d'une campagne.
 */
export async function listCreativesByCampaign(campaignId: string) {
  return prisma.adCreative.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { impressions: true, clicks: true },
      },
    },
  });
}

/**
 * Liste les créatifs actifs d'une campagne.
 */
export async function getActiveCreativesByCampaign(campaignId: string) {
  return prisma.adCreative.findMany({
    where: { campaignId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Active/désactive un créatif.
 */
export async function toggleCreativeActive(id: string, isActive: boolean) {
  return prisma.adCreative.update({
    where: { id },
    data: { isActive },
  });
}

/**
 * Supprime un créatif.
 */
export async function deleteCreative(id: string) {
  return prisma.adCreative.delete({
    where: { id },
  });
}

/**
 * Génère le snippet MJML par défaut pour une bannière.
 */
export function generateDefaultMjmlSnippet(
  imageUrl: string,
  clickUrl: string,
  altText?: string
): string {
  return `
<mj-section padding="20px 0">
  <mj-column>
    <mj-image 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      href="${clickUrl}"
      padding="0"
      border-radius="8px"
    />
  </mj-column>
</mj-section>
`.trim();
}

/**
 * Génère le snippet HTML par défaut pour une bannière.
 */
export function generateDefaultHtmlSnippet(
  imageUrl: string,
  clickUrl: string,
  altText?: string
): string {
  return `
<div style="text-align: center; padding: 20px 0;">
  <a href="${clickUrl}" target="_blank" rel="noopener noreferrer">
    <img 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      style="max-width: 100%; height: auto; border-radius: 8px; border: 0;"
    />
  </a>
</div>
`.trim();
}
