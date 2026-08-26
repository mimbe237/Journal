/**
 * Système de variantes pour les éditions
 * Utilisé par EditionReader et GuestEditionReader
 * pour appliquer des styles/configs spécifiques par type de journal
 */

export type VariantKey = "CT" | "WSL" | "CBT" | "CI" | "NYANGA";

export interface VariantConfig {
  brandName: string;
  loadingGradient: string;
  progressStyle: React.CSSProperties;
  offerBorderColor: string;
  offerTextColor: string;
  thumbActiveBorder: string;
}

export const VARIANTS: Record<VariantKey, VariantConfig> = {
  CT: {
    brandName: "Cameroon Tribune",
    loadingGradient:
      "linear-gradient(135deg, #0d3320 0%, #1a5c35 40%, #237a46 70%, #1a5c35 100%)",
    progressStyle: {
      background: "linear-gradient(90deg,#f59e0b,#fbbf24,#fde68a)",
      boxShadow: "0 0 12px #f59e0b88",
    },
    offerBorderColor: "#f59e0b",
    offerTextColor: "#d97706",
    thumbActiveBorder: "border-amber-500 ring-2 ring-amber-200",
  },
  WSL: {
    brandName: "Weekend Sports & Loisirs",
    loadingGradient:
      "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 40%, #dc2626 70%, #b91c1c 100%)",
    progressStyle: {
      background: "linear-gradient(90deg,#dc2626,#ef4444,#16a34a)",
    },
    offerBorderColor: "#dc2626",
    offerTextColor: "#b91c1c",
    thumbActiveBorder: "border-red-500 ring-2 ring-red-200",
  },
  CBT: {
    brandName: "Cameroon Business Today",
    loadingGradient:
      "linear-gradient(135deg, #0c1a3d 0%, #1e3a8a 40%, #2563eb 70%, #1e3a8a 100%)",
    progressStyle: {
      background: "linear-gradient(90deg,#1d4ed8,#60a5fa,#93c5fd)",
      boxShadow: "0 0 12px #2563eb88",
    },
    offerBorderColor: "#2563eb",
    offerTextColor: "#1d4ed8",
    thumbActiveBorder: "border-blue-500 ring-2 ring-blue-200",
  },
  CI: {
    brandName: "Cameroon Insider",
    loadingGradient:
      "linear-gradient(135deg, #1a0a0a 0%, #6b1a1a 40%, #9b2c2c 70%, #6b1a1a 100%)",
    progressStyle: {
      background: "linear-gradient(90deg,#9b2c2c,#e53e3e,#f97316)",
      boxShadow: "0 0 12px #9b2c2c88",
    },
    offerBorderColor: "#9b2c2c",
    offerTextColor: "#7b1f1f",
    thumbActiveBorder: "border-red-800 ring-2 ring-red-300",
  },
  NYANGA: {
    brandName: "Nyanga Magazine",
    loadingGradient:
      "linear-gradient(135deg, #431407 0%, #c2410c 40%, #ea580c 70%, #c2410c 100%)",
    progressStyle: {
      background: "linear-gradient(90deg,#ea580c,#fb923c,#fbbf24)",
      boxShadow: "0 0 12px #ea580c88",
    },
    offerBorderColor: "#ea580c",
    offerTextColor: "#c2410c",
    thumbActiveBorder: "border-orange-500 ring-2 ring-orange-200",
  },
};

/**
 * Détecte la variante en fonction du nom du journal
 * @param name - Le nom du journal ou du type de journal
 * @returns La clé de variante correspondante (par défaut CT)
 */
export function detectVariant(name?: string | null): VariantKey {
  if (!name) return "CT";
  const n = name.toLowerCase();
  if (n.includes("wsl") || n.includes("weekend") || n.includes("sport")) return "WSL";
  if (n.includes("cbt") || n.includes("business")) return "CBT";
  if (n.includes("insider") || n.includes(" ci") || n === "ci") return "CI";
  if (n.includes("nyanga")) return "NYANGA";
  return "CT";
}
