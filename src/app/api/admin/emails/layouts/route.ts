import { NextRequest, NextResponse } from "next/server";
import { UserRole, Prisma } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

// GET: Liste des layouts
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const layouts = await prisma.emailLayout.findMany({
      orderBy: { nom: "asc" },
      include: { _count: { select: { templates: true } } }
    });

    return NextResponse.json({ layouts });
  } catch (error: any) {
    console.error("[api/admin/emails/layouts] GET error:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}

// POST: Créer un layout
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const body = await req.json();
    const { nom, description, mjml } = body;

    if (!nom || !mjml) {
      return NextResponse.json({ error: "Nom et MJML requis" }, { status: 400 });
    }

    // Vérifier que le MJML contient {{content}}
    if (!mjml.includes("{{content}}")) {
      return NextResponse.json({ error: "Le layout doit contenir {{content}} pour insérer le corps du template" }, { status: 400 });
    }

    const layout = await prisma.emailLayout.create({
      data: { nom, description, mjml }
    });

    return NextResponse.json({ layout }, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/emails/layouts] POST error:", error);
    return NextResponse.json({ error: error?.message || "Erreur création" }, { status: 500 });
  }
}
