
export type TokenValues = Record<string, string | number | boolean | null | undefined | Record<string, string | number | boolean | null | undefined>>;

/**
 * Liste des tokens disponibles par catégorie (pour l'éditeur).
 */
export const AVAILABLE_TOKENS = {
  user: {
    "user.nom": "Nom complet de l'utilisateur",
    "user.email": "Adresse email",
    "user.pays": "Pays de l'utilisateur"
  },
  subscription: {
    "subscription.type": "Type d'abonnement (MENSUEL, ANNUEL, etc.)",
    "subscription.dateDebut": "Date de début",
    "subscription.dateFin": "Date d'expiration",
    "subscription.montant": "Montant payé",
    "subscription.devise": "Devise (XOF, EUR, etc.)"
  },
  enterprise: {
    "enterprise.nom": "Nom de l'entreprise",
    "enterprise.licences": "Nombre de licences"
  },
  edition: {
    "edition.titre": "Titre de l'édition",
    "edition.datePublication": "Date de publication",
    "edition.lien": "Lien vers l'édition"
  },
  // Tokens publicitaires
  ad: {
    "ad.hasAd": "Indique si une pub est présente (true/false)",
    "ad.imageUrl": "URL de l'image publicitaire",
    "ad.clickUrl": "URL de destination au clic",
    "ad.altText": "Texte alternatif de la bannière",
    "ad.html": "HTML de la bannière (prêt à insérer)",
    "ad.mjml": "MJML de la bannière (pour templates email)",
    "ad.advertiser": "Nom de l'annonceur",
    "ad.campaignId": "ID de la campagne (pour tracking)",
    "ad.creativeId": "ID du créatif (pour tracking)"
  },
  system: {
    "app.url": "URL de l'application",
    "app.supportEmail": "Email du support",
    "date.aujourdhui": "Date du jour"
  }
} as const;

/**
 * Génère des valeurs d'exemple pour l'aperçu.
 */
export function getSampleTokenValues(): TokenValues {
  return {
    user: {
      nom: "Jean Dupont",
      email: "jean.dupont@example.com",
      pays: "Cameroun"
    },
    subscription: {
      type: "ANNUEL",
      dateDebut: "01/01/2025",
      dateFin: "31/12/2025",
      montant: "25000",
      devise: "XOF"
    },
    enterprise: {
      nom: "Acme Corp",
      licences: "10"
    },
    edition: {
      titre: "Cameroon Tribune N°12345",
      datePublication: "15/12/2025",
      lien: "https://journal.example.com/editions/12345"
    },
    ad: {
      hasAd: "true",
      imageUrl: "https://example.com/pub-exemple.jpg",
      clickUrl: "https://example.com/offre-speciale",
      altText: "Offre spéciale - Cliquez ici",
      html: '<div style="text-align:center;"><a href="https://example.com"><img src="https://example.com/pub.jpg" alt="Pub"/></a></div>',
      mjml: '<mj-section><mj-column><mj-image src="https://example.com/pub.jpg" href="https://example.com"/></mj-column></mj-section>',
      advertiser: "Entreprise Exemple",
      campaignId: "sample-campaign-id",
      creativeId: "sample-creative-id"
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || "https://journal.example.com",
      supportEmail: "support@journal.example.com"
    },
    date: {
      aujourdhui: new Date().toLocaleDateString("fr-FR")
    }
  };
}

/**
 * Crée les tokens publicitaires à partir d'une sélection de pub.
 * À utiliser lors de l'envoi d'un email avec publicité.
 */
export function createAdTokenValues(ad: {
  campaignId: string;
  creativeId: string;
  imageUrl: string;
  clickUrl: string;
  altText?: string | null;
  htmlSnippet?: string | null;
  mjmlSnippet?: string | null;
  advertiserName?: string;
} | null): TokenValues["ad"] {
  if (!ad) {
    return {
      hasAd: "false",
      imageUrl: null,
      clickUrl: null,
      altText: null,
      html: null,
      mjml: null,
      advertiser: null,
      campaignId: null,
      creativeId: null
    };
  }

  return {
    hasAd: "true",
    imageUrl: ad.imageUrl,
    clickUrl: ad.clickUrl,
    altText: ad.altText || "Publicité",
    html: ad.htmlSnippet || generateDefaultAdHtml(ad.imageUrl, ad.clickUrl, ad.altText),
    mjml: ad.mjmlSnippet || generateDefaultAdMjml(ad.imageUrl, ad.clickUrl, ad.altText),
    advertiser: ad.advertiserName || "",
    campaignId: ad.campaignId,
    creativeId: ad.creativeId
  };
}

/**
 * Génère le HTML par défaut pour une bannière publicitaire.
 */
function generateDefaultAdHtml(imageUrl: string, clickUrl: string, altText?: string | null): string {
  return `
<div style="text-align: center; padding: 20px 0; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
  <a href="${clickUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
    <img 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      style="max-width: 100%; height: auto; border-radius: 8px; border: 0;"
    />
  </a>
  <p style="font-size: 10px; color: #6c757d; margin-top: 8px;">Publicité</p>
</div>
`.trim();
}

/**
 * Génère le MJML par défaut pour une bannière publicitaire.
 */
function generateDefaultAdMjml(imageUrl: string, clickUrl: string, altText?: string | null): string {
  return `
<mj-section padding="20px" background-color="#f8f9fa">
  <mj-column>
    <mj-image 
      src="${imageUrl}" 
      alt="${altText || "Publicité"}" 
      href="${clickUrl}"
      padding="0"
      border-radius="8px"
    />
    <mj-text align="center" font-size="10px" color="#6c757d" padding-top="8px">
      Publicité
    </mj-text>
  </mj-column>
</mj-section>
`.trim();
}
