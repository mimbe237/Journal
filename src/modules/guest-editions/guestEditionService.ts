import { GuestEdition, Prisma } from "@prisma/client";
import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";

const editionSelect = {
  id: true,
  titre: true,
  datePublication: true,
  type: true,
  nombrePages: true,
  cheminImageUne: true,
  cheminInternePdf: true,
  deletedAt: true,
} satisfies Prisma.EditionSelect;

type GuestEditionWithEdition = GuestEdition & {
  edition: Prisma.EditionGetPayload<{ select: typeof editionSelect }> | null;
};

export async function getAllGuestEditions(): Promise<GuestEditionWithEdition[]> {
  await prismaRuntimeReady;

  return prisma.guestEdition.findMany({
    orderBy: { dayOfWeek: "asc" },
    include: {
      edition: {
        select: editionSelect,
      },
    },
  });
}

export async function getGuestEditionByToken(
  token: string
): Promise<GuestEditionWithEdition | null> {
  await prismaRuntimeReady;

  const slot = await prisma.guestEdition.findUnique({
    where: { publicToken: token },
    include: {
      edition: {
        select: editionSelect,
      },
    },
  });

  if (!slot) return null;
  if (!slot.isActive) return null;
  if (!slot.editionId || !slot.edition) return null;
  if (slot.edition.deletedAt !== null) return null;

  return slot;
}

export async function updateGuestEditionSlot(
  id: string,
  editionId: string | null
): Promise<GuestEditionWithEdition> {
  await prismaRuntimeReady;

  if (editionId !== null) {
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      select: { id: true, deletedAt: true },
    });

    if (!edition || edition.deletedAt !== null) {
      throw new Error("Edition introuvable");
    }
  }

  const newToken = crypto.randomUUID();

  return prisma.guestEdition.update({
    where: { id },
    data: {
      editionId,
      publicToken: newToken,
      assignedAt: editionId !== null ? new Date() : null,
    },
    include: {
      edition: {
        select: editionSelect,
      },
    },
  });
}

export async function getGuestEditionById(
  id: string
): Promise<GuestEdition | null> {
  await prismaRuntimeReady;

  return prisma.guestEdition.findUnique({
    where: { id },
  });
}
