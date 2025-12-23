import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

export async function GET() {
  try {
    // 1. Ajouter la colonne headlines (JSONB)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "editions" ADD COLUMN IF NOT EXISTS "headlines" JSONB;
    `);

    // 2. Ajouter la colonne tags (TEXT[])
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "editions" ADD COLUMN IF NOT EXISTS "tags" TEXT[];
    `);

    // 3. Créer le type ENUM InterestCategory s'il n'existe pas
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "InterestCategory" AS ENUM ('ECONOMIE', 'TECH', 'POLITIQUE', 'SOCIETE', 'EDUCATION', 'SPORT');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    } catch (e) {
      console.log("Enum InterestCategory existe déjà ou erreur ignorée");
    }

    // 4. Ajouter la colonne interests sur users
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" "InterestCategory"[] DEFAULT ARRAY[]::"InterestCategory"[];
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Base de données réparée : headlines, tags, et interests ajoutés." 
    });
  } catch (error: any) {
    console.error("Erreur migration manuelle:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
