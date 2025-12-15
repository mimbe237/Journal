import { NextRequest, NextResponse } from "next/server";
import { UserRole, EmailTemplateStatus, EmailCategory, Prisma } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

// GET: Liste des templates avec filtres
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as EmailTemplateStatus | null;
    const category = searchParams.get("category") as EmailCategory | null;
    const locale = searchParams.get("locale");
    const search = searchParams.get("search");

    const where: Prisma.EmailTemplateWhereInput = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (locale) where.locale = locale;
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } }
      ];
    }

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        layout: { select: { id: true, nom: true } },
        _count: { select: { sends: true, versions: true } }
      }
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("[api/admin/emails/templates] GET error:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}

// POST: Créer un nouveau template
export async function POST(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const body = await req.json();
    const { slug, nom, description, category, sujet, corps, corpsText, locale, layoutId, tokens } = body;

    if (!slug || !nom || !sujet || !corps) {
      return NextResponse.json({ error: "Champs requis manquants (slug, nom, sujet, corps)" }, { status: 400 });
    }

    // Vérifier unicité du slug
    const existing = await prisma.emailTemplate.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Un template avec ce slug existe déjà" }, { status: 409 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        slug,
        nom,
        description,
        category: category || EmailCategory.TRANSACTIONAL,
        sujet,
        corps,
        corpsText,
        locale: locale || "fr",
        layoutId,
        tokens,
        status: EmailTemplateStatus.DRAFT
      },
      include: { layout: true }
    });

    // Créer la première version
    await prisma.emailTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        sujet,
        corps,
        corpsText
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("[api/admin/emails/templates] POST error:", error);
    return NextResponse.json({ error: error?.message || "Erreur création" }, { status: 500 });
  }
}
