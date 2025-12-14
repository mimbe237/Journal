import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";

export async function GET() {
  try {
    // Test simple : compter les utilisateurs
    const count = await prisma.user.count();
    return NextResponse.json({ 
      status: "success", 
      message: "Connexion réussie !", 
      userCount: count,
      env: {
        // On n'affiche pas tout pour la sécurité, juste la structure
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlStart: process.env.DATABASE_URL?.substring(0, 15) + "...",
        isPgbouncer: process.env.DATABASE_URL?.includes("pgbouncer=true"),
        port: process.env.DATABASE_URL?.match(/:(\d+)/)?.[1]
      }
    });
  } catch (error: any) {
    console.error("DB Error:", error);
    return NextResponse.json({ 
      status: "error", 
      message: error.message, 
      code: error.code,
      meta: error.meta 
    }, { status: 500 });
  }
}
