import { JournalType } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Génère le titre d'une édition à partir du template du type de journal.
 * Tokens supportés:
 * - {{journal}}: Nom du journal
 * - {{date}}: Date format JJ/MM/AAAA
 * - {{date_long}}: Date format "17 décembre 2025"
 * - {{frequency}}: Fréquence (Quotidien, Hebdomadaire, etc.)
 */
export function generateEditionTitle(
  journalType: JournalType,
  datePublication: Date
): string {
  if (!journalType.titleTemplate) {
    return `${journalType.name} - ${format(datePublication, "dd/MM/yyyy")}`;
  }

  let title = journalType.titleTemplate;

  // Remplacement des tokens
  title = title.replace(/\{\{journal\}\}/g, journalType.name);
  title = title.replace(/\{\{date\}\}/g, format(datePublication, "dd/MM/yyyy"));
  title = title.replace(/\{\{date_long\}\}/g, format(datePublication, "d MMMM yyyy", { locale: fr }));
  title = title.replace(/\{\{frequency\}\}/g, journalType.frequency.toLowerCase());

  return title;
}
