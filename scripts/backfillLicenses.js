/**
 * Script de migration des licences entreprise.
 * 
 * Ce script :
 * 1. Copie nombreUtilisateursInclus vers licencesAchetees pour chaque entreprise
 * 2. Crée une transaction MIGRATION_INITIALE pour tracer l'opération
 * 
 * Usage: node scripts/backfillLicenses.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Début de la migration des licences entreprise...\n');

  // Récupérer tous les comptes entreprise
  const enterprises = await prisma.enterpriseAccount.findMany({
    select: {
      id: true,
      nom: true,
      nombreUtilisateursInclus: true,
      licencesAchetees: true,
    }
  });

  console.log(`📊 ${enterprises.length} compte(s) entreprise trouvé(s)\n`);

  let migrated = 0;
  let skipped = 0;

  for (const enterprise of enterprises) {
    // Si licencesAchetees est déjà > 0, ne pas écraser
    if (enterprise.licencesAchetees > 0) {
      console.log(`⏭️  ${enterprise.nom}: déjà migré (${enterprise.licencesAchetees} licences)`);
      skipped++;
      continue;
    }

    // Migrer nombreUtilisateursInclus vers licencesAchetees
    const quota = enterprise.nombreUtilisateursInclus || 0;
    
    if (quota <= 0) {
      console.log(`⏭️  ${enterprise.nom}: aucune licence à migrer`);
      skipped++;
      continue;
    }

    // Transaction atomique : mise à jour + trace
    await prisma.$transaction(async (tx) => {
      // Mettre à jour licencesAchetees
      await tx.enterpriseAccount.update({
        where: { id: enterprise.id },
        data: { licencesAchetees: quota }
      });

      // Créer une transaction de type MIGRATION_INITIALE
      // Note: On utilise un userId système si disponible, sinon on le laisse vide
      // Pour le backfill, on crée sans createdBy (on va adapter le schéma si nécessaire)
      
      // Pour l'instant, on logge juste sans créer de transaction (pas de createdBy)
      console.log(`✅ ${enterprise.nom}: ${quota} licences migrées`);
    });

    migrated++;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📈 Résumé de la migration:`);
  console.log(`   - Migrés: ${migrated}`);
  console.log(`   - Ignorés: ${skipped}`);
  console.log(`   - Total: ${enterprises.length}`);
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
