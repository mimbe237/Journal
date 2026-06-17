import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAYS = [
  { dayOfWeek: 1, dayLabel: "Lundi" },
  { dayOfWeek: 2, dayLabel: "Mardi" },
  { dayOfWeek: 3, dayLabel: "Mercredi" },
  { dayOfWeek: 4, dayLabel: "Jeudi" },
  { dayOfWeek: 5, dayLabel: "Vendredi" },
  { dayOfWeek: 6, dayLabel: "Samedi" },
  { dayOfWeek: 7, dayLabel: "Dimanche" },
];

async function main() {
  console.log("Seeding guest_editions table...");

  for (const day of DAYS) {
    const result = await prisma.guestEdition.upsert({
      where: { dayOfWeek: day.dayOfWeek },
      create: {
        dayOfWeek: day.dayOfWeek,
        dayLabel: day.dayLabel,
        editionId: null,
        isActive: true,
      },
      update: {
        dayLabel: day.dayLabel,
        // Ne jamais écraser editionId, publicToken ou assignedAt s'ils existent déjà
      },
    });

    console.log(`[${result.dayOfWeek}] ${result.dayLabel} — token: ${result.publicToken.slice(0, 8)}...`);
  }

  console.log("Done. 7 guest edition slots ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
