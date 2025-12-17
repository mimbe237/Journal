
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
    "edition.datePublication": "Date de publication"
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
      datePublication: "15/12/2025"
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
