/**
 * Service de gestion des types de journaux.
 * Gère le CRUD et les grilles tarifaires.
 */

import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import { JournalFrequency, Prisma } from "@prisma/client";

// Types pour les entrées/sorties
export interface JournalTypeInput {
  name: string;
  frequency: JournalFrequency;
  unitPrice: number;
  monthlyPrice: number;
  sixMonthPrice: number;
  yearlyPrice: number;
  titleTemplate?: string | null;
  isActive?: boolean;
}

export interface JournalTypeWithPricing {
  id: string;
  name: string;
  frequency: JournalFrequency;
  unitPrice: number;
  monthlyPrice: number;
  sixMonthPrice: number;
  yearlyPrice: number;
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
  const journalTypes = await prisma.journalType.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: {
        select: { editions: true }
      }
    },
    orderBy: { name: "asc" }
  });

  const defaultTemplate = "Edition du {{date_long}}";

  return journalTypes.map(jt => ({
    ...jt,
    unitPrice: Number(jt.unitPrice),
    monthlyPrice: Number(jt.monthlyPrice),
    sixMonthPrice: Number(jt.sixMonthPrice),
    yearlyPrice: Number(jt.yearlyPrice),
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
  const journalType = await prisma.journalType.findUnique({
    where: { id },
    include: {
      _count: {
        select: { editions: true }
      }
    }
  });

  if (!journalType) return null;
  const defaultTemplate = "Edition du {{date_long}}";

  return {
    ...journalType,
    unitPrice: Number(journalType.unitPrice),
    monthlyPrice: Number(journalType.monthlyPrice),
    sixMonthPrice: Number(journalType.sixMonthPrice),
    yearlyPrice: Number(journalType.yearlyPrice),
    titleTemplate: journalType.titleTemplate ?? defaultTemplate
  };
}

/**
 * Crée un nouveau type de journal.
 */
export async function createJournalType(input: JournalTypeInput): Promise<JournalTypeWithPricing> {
  await prismaRuntimeReady;
  const defaultTemplate = "Edition du {{date_long}}";
  const journalType = await prisma.journalType.create({
    data: {
      name: input.name,
      frequency: input.frequency,
      unitPrice: new Prisma.Decimal(input.unitPrice),
      monthlyPrice: new Prisma.Decimal(input.monthlyPrice),
      sixMonthPrice: new Prisma.Decimal(input.sixMonthPrice),
      yearlyPrice: new Prisma.Decimal(input.yearlyPrice),
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
    monthlyPrice: Number(journalType.monthlyPrice),
    sixMonthPrice: Number(journalType.sixMonthPrice),
    yearlyPrice: Number(journalType.yearlyPrice),
    titleTemplate: journalType.titleTemplate ?? defaultTemplate
  };
}

/**
 * Met à jour un type de journal.
 */
export async function updateJournalType(id: string, input: Partial<JournalTypeInput>): Promise<JournalTypeWithPricing> {
  await prismaRuntimeReady;
  const data: Prisma.JournalTypeUpdateInput = {};
  const defaultTemplate = "Edition du {{date_long}}";

  if (input.name !== undefined) data.name = input.name;
  if (input.frequency !== undefined) data.frequency = input.frequency;
  if (input.unitPrice !== undefined) data.unitPrice = new Prisma.Decimal(input.unitPrice);
  if (input.monthlyPrice !== undefined) data.monthlyPrice = new Prisma.Decimal(input.monthlyPrice);
  if (input.sixMonthPrice !== undefined) data.sixMonthPrice = new Prisma.Decimal(input.sixMonthPrice);
  if (input.yearlyPrice !== undefined) data.yearlyPrice = new Prisma.Decimal(input.yearlyPrice);
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
    monthlyPrice: Number(journalType.monthlyPrice),
    sixMonthPrice: Number(journalType.sixMonthPrice),
    yearlyPrice: Number(journalType.yearlyPrice),
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
