const { PrismaClient, UserRole } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

const users = [
  {
    email: "abonne@journal.com",
    nom: "Abonné",
    motDePasse: "Abonne123@@",
    role: UserRole.ABONNE
  },
  {
    email: "admin@journal.com",
    nom: "Admin",
    motDePasse: "AdminJournal123@@",
    role: UserRole.SUPER_ADMIN
  },
  {
    email: "entreprise@journal.com",
    nom: "Entreprise",
    motDePasse: "Entreprise123@@",
    role: UserRole.COMPTE_ENTREPRISE
  },
  {
    email: "uentreprise@journal.com",
    nom: "Utilisateur Entreprise",
    motDePasse: "Uentreprise123@@",
    role: UserRole.UTILISATEUR_ENTREPRISE
  }
];

async function main() {
  for (const user of users) {
    const hash = await bcrypt.hash(user.motDePasse, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nom: user.nom,
        motDePasseHash: hash,
        role: user.role
      },
      create: {
        nom: user.nom,
        email: user.email,
        motDePasseHash: hash,
        role: user.role
      }
    });
    console.log(`Seeded user: ${user.email} (${user.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
