/**
 * Script de seed pour les types de journaux.
 * Usage: node scripts/seedJournalTypes.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const journalTypes = [
  {
    name: "Cameroon Tribune",
    frequency: "QUOTIDIEN",
    unitPrice: 500,
    monthlyPrice: 10000,
    sixMonthPrice: 51000,
    yearlyPrice: 90000,
    isActive: true
  },
  {
    name: "Nyanga Magazine",
    frequency: "HEBDOMADAIRE",
    unitPrice: 1500,
    monthlyPrice: 5000,
    sixMonthPrice: 25500,
    yearlyPrice: 45000,
    isActive: true
  },
  {
    name: "Edition Speciale",
    frequency: "SPECIAL",
    unitPrice: 2000,
    monthlyPrice: 0,
    sixMonthPrice: 0,
    yearlyPrice: 0,
    isActive: true
  }
];

async function main() {
  console.log("Seeding journal types...\n");

  for (const jt of journalTypes) {
    const existing = await prisma.journalType.findUnique({
      where: { name: jt.name }
    });

    if (existing) {
      console.log("  " + jt.name + " existe deja, mise a jour...");
      await prisma.journalType.update({
        where: { name: jt.name },
        data: jt
      });
    } else {
      console.log("  Creation de " + jt.name + "...");
      await prisma.journalType.create({
        data: jt
      });
    }
  }

  console.log("\nSeed termine !");
  
  const count = await prisma.journalType.count();
  console.log("   " + count + " type(s) de journal en base.\n");
}

main()
  .catch((e) => {
    console.error("Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
