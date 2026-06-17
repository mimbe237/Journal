import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !['SUPER_ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const url = new URL(req.url);
    const takeParam = url.searchParams.get("take");
    const take = Math.min(Math.max(Number(takeParam) || 5, 1), 20);

    const editions = await prisma.edition.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        titre: true,
        createdAt: true,
        nombrePages: true,
        cheminInternePdf: true,
        cheminImageUne: true,
      },
    });

    return NextResponse.json({ ok: true, count: editions.length, editions });
  } catch (error: any) {
    console.error("recent editions error:", error);
    return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });
  }
}
