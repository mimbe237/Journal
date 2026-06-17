/**
 * Service de gestion des types de journaux.
 * Gère le CRUD et les grilles tarifaires.
 */

import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import { JournalFrequency, Prisma } from "@prisma/client";

let ensureTitleTemplatePromise: Promise<void> | null = null;

async function ensureTitleTemplateColumn(force = false) {
  if (ensureTitleTemplatePromise && !force) {
    return ensureTitleTemplatePromise;
  }

  ensureTitleTemplatePromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "journal_types" ADD COLUMN IF NOT EXISTS "titleTemplate" VARCHAR(255);'
      );

      const [{ exists: hasSnakeCase } = { exists: false }] = await prisma.$queryRaw<
        { exists: boolean }[]
      >`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'journal_types'
            AND column_name = 'title_template'
        ) AS "exists"
      `;

      if (hasSnakeCase) {
        await prisma.$executeRawUnsafe(
          'UPDATE "journal_types" SET "titleTemplate" = COALESCE("titleTemplate", "title_template", \'Edition du {{date_long}}\') WHERE "titleTemplate" IS NULL;'
        );
      } else {
        await prisma.$executeRawUnsafe(
          'UPDATE "journal_types" SET "titleTemplate" = COALESCE("titleTemplate", \'Edition du {{date_long}}\') WHERE "titleTemplate" IS NULL;'
        );
      }
    } catch (error) {
      console.error("[journalType] ensure titleTemplate column failed", error);
    }
  })();

  return ensureTitleTemplatePromise;
}

function isMissingTitleTemplateColumn(error: unknown) {
  return (
    error instanceof Error &&
    /column .*titleTemplate|column .*title_template/i.test(error.message)
  );
}

// Types pour les entrées/sorties
export interface JournalTypeInput {
  name: string;
  frequency: JournalFrequency;
  unitPrice: number;
  titleTemplate?: string | null;
  isActive?: boolean;
}

export interface JournalTypeWithPricing {
  id: string;
  name: string;
  frequency: JournalFrequency;
  unitPrice: number;
  isActive: boolean;
  titleTemplate: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    editions: number;
  };
}

/**
 * Récupère tous les types de journaux.
 */
export async function listJournalTypes(includeInactive = false): Promise<JournalTypeWithPricing[]> {
  await prismaRuntimeReady;
  await ensureTitleTemplateColumn();

  let journalTypes: Awaited<ReturnType<typeof prisma.journalType.findMany>>;
  try {
    journalTypes = await prisma.journalType.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { editions: true }
        }
      },
      orderBy: { name: "asc" }
    });
  } catch (error) {
    if (isMissingTitleTemplateColumn(error)) {
      await ensureTitleTemplateColumn(true);
      journalTypes = await prisma.journalType.findMany({
        where: includeInactive ? {} : { isActive: true },
        include: {
          _count: {
            select: { editions: true }
          }
        },
        orderBy: { name: "asc" }
      });
    } else {
      throw error;
    }
  }

  const defaultTemplate = "Edition du {{date_long}}";

  return journalTypes.map(jt => ({
    ...jt,
    unitPrice: Number(jt.unitPrice),
    titleTemplate: jt.titleTemplate ?? defaultTemplate
  }));
}

/**
 * Récupère les types de journaux actifs avec leur grille tarifaire.
 * Utilisé pour l'affichage public et les formulaires.
 */
export async function getActiveJournalTypesWithPricing(): Promise<JournalTypeWithPricing[]> {
  return listJournalTypes(false);
}

/**
 * Récupère un type de journal par son ID.
 */
export async function getJournalTypeById(id: string): Promise<JournalTypeWithPricing | null> {
  await prismaRuntimeReady;
  await ensureTitleTemplateColumn();
  let journalType: Awaited<ReturnType<typeof prisma.journalType.findUnique>>;

  try {
    journalType = await prisma.journalType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { editions: true }
        }
      }
    });
  } catch (error) {
    if (isMissingTitleTemplateColumn(error)) {
      await ensureTitleTemplateColumn(true);
      journalType = await prisma.journalType.findUnique({
        where: { id },
        include: {
          _count: {
            select: { editions: true }
          }
        }
      });
    } else {
      throw error;
    }
  }

  if (!journalType) return null;
  const defaultTemplate = "Edition du {{date_long}}";

  return {
    ...journalType,
    unitPrice: Number(journalType.unitPrice),
    titleTemplate: journalType.titleTemplate ?? defaultTemplate
  };
}

/**
 * Crée un nouveau type de journal.
 */
export async function createJournalType(input: JournalTypeInput): Promise<JournalTypeWithPricing> {
  await prismaRuntimeReady;
  await ensureTitleTemplateColumn();
  const defaultTemplate = "Edition du {{date_long}}";
  const journalType = await prisma.journalType.create({
    data: {
      name: input.name,
      frequency: input.frequency,
      unitPrice: new Prisma.Decimal(input.unitPrice),
      titleTemplate: input.titleTemplate ?? defaultTemplate,
      isActive: input.isActive ?? true
    },
    include: {
      _count: {
        select: { editions: true }
      }
    }
  });

  return {
    ...journalType,
    unitPrice: Number(journalType.unitPrice),
    titleTemplate: journalType.titleTemplate ?? defaultTemplate
  };
}

/**
 * Met à jour un type de journal.
 */
export async function updateJournalType(id: string, input: Partial<JournalTypeInput>): Promise<JournalTypeWithPricing> {
  await prismaRuntimeReady;
  await ensureTitleTemplateColumn();
  const data: Prisma.JournalTypeUpdateInput = {};
  const defaultTemplate = "Edition du {{date_long}}";

  if (input.name !== undefined) data.name = input.name;
  if (input.frequency !== undefined) data.frequency = input.frequency;
  if (input.unitPrice !== undefined) data.unitPrice = new Prisma.Decimal(input.unitPrice);
  if (input.titleTemplate !== undefined) data.titleTemplate = input.titleTemplate;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const journalType = await prisma.journalType.update({
    where: { id },
    data,
    include: {
      _count: {
        select: { editions: true }
      }
    }
  });

  return {
    ...journalType,
    unitPrice: Number(journalType.unitPrice),
    titleTemplate: journalType.titleTemplate ?? defaultTemplate
  };
}

/**
 * Active ou désactive un type de journal.
 */
export async function toggleJournalTypeStatus(id: string): Promise<JournalTypeWithPricing> {
  const current = await prisma.journalType.findUnique({
    where: { id },
    select: { isActive: true }
  });

  if (!current) {
    throw new Error("Type de journal non trouvé");
  }

  return updateJournalType(id, { isActive: !current.isActive });
}

/**
 * Vérifie si un type de journal peut être supprimé (pas d'éditions associées).
 */
export async function canDeleteJournalType(id: string): Promise<boolean> {
  const count = await prisma.edition.count({
    where: { journalTypeId: id }
  });
  return count === 0;
}

/**
 * Supprime un type de journal.
 * @throws Error si des éditions sont associées.
 */
export async function deleteJournalType(id: string): Promise<void> {
  const canDelete = await canDeleteJournalType(id);
  if (!canDelete) {
    throw new Error("Impossible de supprimer ce type de journal car des éditions y sont associées.");
  }

  await prisma.journalType.delete({
    where: { id }
  });
}
