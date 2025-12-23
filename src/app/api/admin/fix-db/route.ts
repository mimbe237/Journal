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

    return NextResponse.json({ 
      success: true, 
      message: "Base de données mise à jour avec succès (Colonnes 'headlines' et 'tags' ajoutées)." 
    });
  } catch (error: any) {
    console.error("Erreur migration manuelle:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
