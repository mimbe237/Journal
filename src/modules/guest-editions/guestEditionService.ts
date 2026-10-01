import { GuestEdition, Prisma } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";

const editionSelect = {
  id: true,
  titre: true,
  datePublication: true,
  type: true,
  journalTypeId: true,
  nombrePages: true,
  cheminImageUne: true,
  cheminInternePdf: true,
  deletedAt: true,
  journalType: {
    select: { name: true },
  },
} satisfies Prisma.EditionSelect;

type GuestEditionWithEdition = GuestEdition & {
  edition: Prisma.EditionGetPayload<{ select: typeof editionSelect }> | null;
};

export async function getAllGuestEditions(): Promise<GuestEditionWithEdition[]> {
  return prisma.guestEdition.findMany({
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
    include: { edition: { select: editionSelect } },
  });
}

export async function createGuestEditionSlot(): Promise<GuestEditionWithEdition> {
  const count = await prisma.guestEdition.count();
  return prisma.guestEdition.create({
    data: {
      dayOfWeek: count + 1,
      dayLabel: `Créneau ${count + 1}`,
      publicToken: crypto.randomUUID(),
      isActive: true,
    },
    include: { edition: { select: editionSelect } },
  });
}

export async function deleteGuestEditionSlot(id: string): Promise<void> {
  await prisma.guestEdition.delete({ where: { id } });
}

export async function getGuestEditionByToken(
  token: string
): Promise<GuestEditionWithEdition | null> {
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
  return prisma.guestEdition.findUnique({
    where: { id },
  });
}

/**
 * Lien de lecture invité par édition.
 *
 * Le token public n'existe que porté par un créneau `GuestEdition`. Pour chaque
 * édition passée en paramètre :
 *  - si un créneau actif lui est déjà rattaché, on réutilise son token ;
 *  - sinon un créneau est créé à la volée (jour libre = max + 1) et devient son lien.
 *
 * Le token reste stable tant que le créneau n'est pas reconfiguré : un token n'est
 * régénéré que lors d'une réassignation depuis /admin/editions/invite.
 */
export async function ensureGuestLinksForEditions(
  editionIds: string[]
): Promise<Record<string, { token: string }>> {
  const uniqueIds = Array.from(new Set(editionIds.filter((id) => Boolean(id))));
  if (uniqueIds.length === 0) return {};

  const existing = await prisma.guestEdition.findMany({
    where: { editionId: { in: uniqueIds }, isActive: true },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
    select: { editionId: true, publicToken: true },
  });

  const links: Record<string, { token: string }> = {};
  for (const slot of existing) {
    if (slot.editionId && !links[slot.editionId]) {
      links[slot.editionId] = { token: slot.publicToken };
    }
  }

  const missing = uniqueIds.filter((id) => !links[id]);
  if (missing.length === 0) return links;

  const aggregate = await prisma.guestEdition.aggregate({
    _max: { dayOfWeek: true },
  });
  let nextDayOfWeek = (aggregate._max.dayOfWeek ?? 0) + 1;

  for (const editionId of missing) {
    const slot = await prisma.guestEdition.create({
      data: {
        dayOfWeek: nextDayOfWeek,
        dayLabel: "Lien direct",
        editionId,
        publicToken: crypto.randomUUID(),
        assignedAt: new Date(),
        isActive: true,
      },
      select: { publicToken: true },
    });

    links[editionId] = { token: slot.publicToken };
    nextDayOfWeek += 1;
  }

  return links;
}
