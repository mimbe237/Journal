import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import { UserRole } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(request);

    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prismaRuntimeReady;

    const edition = await prisma.edition.findUnique({ where: { id } });
    if (!edition) {
      return NextResponse.json({ error: "Edition not found" }, { status: 404 });
    }

    return NextResponse.json({ edition });
  } catch (error: any) {
    console.error("Error fetching edition:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(request);

    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { titre, datePublication, type } = await request.json();

    if (!titre || !datePublication || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await prismaRuntimeReady;

    const edition = await prisma.edition.update({
      where: { id },
      data: {
        titre,
        datePublication: new Date(datePublication),
        type,
      },
    });

    return NextResponse.json({ edition });
  } catch (error: any) {
    console.error('Error updating edition:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(request);

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prismaRuntimeReady;

    const edition = await prisma.edition.findUnique({ where: { id } });
    if (!edition) {
      return NextResponse.json({ error: "Edition not found" }, { status: 404 });
    }

    // Nettoyage best-effort du stockage local
    try {
      const root = process.env.PRIVATE_STORAGE_ROOT ?? path.join(process.cwd(), "storage");
      const editionDir = path.join(root, "editions", id);
      await fs.rm(editionDir, { recursive: true, force: true });
    } catch (err) {
      console.error("[admin/editions] failed to clean storage", err);
    }

    await prisma.edition.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Error deleting edition:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
