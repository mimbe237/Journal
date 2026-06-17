const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const edition = await prisma.edition.findUnique({ 
    where: { id: 'cmjj2epsi000111t6y02xo0oj' } 
  });
  
  if (edition) {
    console.log('ID:', edition.id);
    console.log('Titre:', edition.titre);
    console.log('PDF:', edition.cheminInternePdf);
  } else {
    console.log('Edition non trouvée');
  }
  
  await prisma.$disconnect();
}

main();
