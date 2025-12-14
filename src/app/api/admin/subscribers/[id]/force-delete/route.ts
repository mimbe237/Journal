import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";

const ALLOWED = [UserRole.SUPER_ADMIN];

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED);
    const { id } = params;

    await prisma.subscription.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur suppression définitive" }, { status: 400 });
  }
}
