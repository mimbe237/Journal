import { NextRequest, NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";

const ALLOWED = [UserRole.SUPER_ADMIN];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED);
    const { id } = await params;

    const trashedUntil = addDays(new Date(), 30);

    const updated = await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), trashedUntil }
    });

    return NextResponse.json({ ok: true, trashedUntil: updated.trashedUntil });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur suppression (corbeille)" }, { status: 400 });
  }
}
