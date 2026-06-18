import { NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";

export async function GET() {
  try {
    // 1. Vérifier si le modèle Prisma est disponible
    const hasModel = typeof prisma.guestEdition !== "undefined";

    // 2. Compter les créneaux
    const count = await prisma.guestEdition.count();

    // 3. Récupérer tous les créneaux (sans include pour tester)
    const slots = await prisma.guestEdition.findMany({
      orderBy: { dayOfWeek: "asc" },
      select: { id: true, dayOfWeek: true, dayLabel: true, editionId: true, isActive: true },
    });

    return NextResponse.json({
      status: "success",
      hasModel,
      count,
      slots,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        port: process.env.DATABASE_URL?.match(/:(\d+)/)?.[1],
      },
    });
  } catch (error: any) {
    console.error("test-guest error:", error?.message ?? error, error?.code, error?.meta);
    return NextResponse.json(
      {
        status: "error",
        message: error?.message ?? String(error),
        code: error?.code ?? null,
        meta: error?.meta ?? null,
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
