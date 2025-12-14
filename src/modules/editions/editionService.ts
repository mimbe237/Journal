import { Edition, EditionType, SystemEventType } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";

/**
 * Crée une édition (métadonnées) en base.
 */
export async function createEdition(params: {
  titre: string;
  datePublication: Date;
  type: EditionType;
  cheminInternePdf: string;
  nombrePages?: number | null;
  prix?: number | null;
  devise?: string | null;
}): Promise<Edition> {
  if (!params.titre?.trim()) throw new Error("Titre requis");
  if (!params.cheminInternePdf?.trim()) throw new Error("cheminInternePdf requis");

  const edition = await prisma.$transaction(async (tx) => {
    const created = await tx.edition.create({
      data: {
        titre: params.titre.trim(),
        datePublication: params.datePublication,
        type: params.type,
        cheminInternePdf: params.cheminInternePdf,
        nombrePages: params.nombrePages ?? null,
        prix: params.prix ?? null,
        devise: params.devise ?? null
      }
    });

    await tx.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.CREATION_EDITION,
        meta: { editionId: created.id, titre: created.titre }
      }
    });

    return created;
  });

  return edition;
}

/**
 * Liste paginée des éditions avec filtres simples.
 */
export async function listEditions(params?: {
  page?: number;
  pageSize?: number;
  type?: EditionType;
  order?: "DESC" | "ASC";
}): Promise<{ data: Edition[]; total: number }> {
  const page = Math.max(params?.page ?? 1, 1);
  const pageSize = Math.min(Math.max(params?.pageSize ?? 20, 1), 100);
  const where = params?.type ? { type: params.type } : {};
  const total = await prisma.edition.count({ where });
  const data = await prisma.edition.findMany({
    where,
    orderBy: { datePublication: params?.order === "ASC" ? "asc" : "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize
  });
  return { data, total };
}

/**
 * Récupère une édition par id.
 */
export function getEditionById(id: string | null | undefined): Promise<Edition | null> {
  const editionId = id?.trim();
  if (!editionId) {
    throw new Error("Identifiant d'édition requis");
  }
  return prisma.edition.findUnique({ where: { id: editionId } });
}

/**
 * Met à jour le nombre de pages après conversion.
 */
export async function updateEditionPageCount(params: {
  editionId: string;
  nombrePages: number;
}): Promise<Edition> {
  if (params.nombrePages <= 0) throw new Error("nombrePages doit être > 0");
  return prisma.edition.update({
    where: { id: params.editionId },
    data: { nombrePages: params.nombrePages }
  });
}
