import { prisma } from "@/lib/config/prisma";
import { PricingSection } from "./PricingSection";

// Server component wrapper that fetches plans and passes them to client component
export async function PricingSectionServer() {
  // On utilise un wrapper client-side qui fetch les données via API
  // car le composant a besoin d'interactivité (toggle Individuel/Entreprise)
  return <PricingSection variant="dark" showToggle={true} />;
}
