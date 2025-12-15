import { NextRequest, NextResponse } from "next/server";
import { UserRole, EmailTemplateStatus } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";
import { renderTemplate, getSampleTokenValues } from "@/modules/emails";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

// GET: Récupérer un template par ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);
    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: {
        layout: true,
        versions: { orderBy: { version: "desc" }, take: 10 },
        _count: { select: { sends: true } }
      }
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("[api/admin/emails/templates/[id]] GET error:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}

// PATCH: Mettre à jour un template
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserWithRoles(req, undefined, ALLOWED_ROLES);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    const { nom, description, category, sujet, corps, corpsText, layoutId, tokens, status } = body;

    // Si le contenu change, créer une nouvelle version
    const contentChanged = (sujet && sujet !== existing.sujet) || (corps && corps !== existing.corps);

    const template = await prisma.$transaction(async (tx) => {
      const updated = await tx.emailTemplate.update({
        where: { id },
        data: {
          nom: nom ?? existing.nom,
          description: description !== undefined ? description : existing.description,
          category: category ?? existing.category,
          sujet: sujet ?? existing.sujet,
          corps: corps ?? existing.corps,
          corpsText: corpsText !== undefined ? corpsText : existing.corpsText,
          layoutId: layoutId !== undefined ? layoutId : existing.layoutId,
          tokens: tokens !== undefined ? tokens : existing.tokens,
          status: status ?? existing.status
        },
        include: { layout: true }
      });

      if (contentChanged) {
        const lastVersion = await tx.emailTemplateVersion.findFirst({
          where: { templateId: id },
          orderBy: { version: "desc" }
        });
        const newVersion = (lastVersion?.version ?? 0) + 1;

        await tx.emailTemplateVersion.create({
          data: {
            templateId: id,
            version: newVersion,
            sujet: sujet ?? existing.sujet,
            corps: corps ?? existing.corps,
            corpsText: corpsText !== undefined ? corpsText : existing.corpsText,
            createdBy: user.id
          }
        });
      }

      return updated;
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("[api/admin/emails/templates/[id]] PATCH error:", error);
    return NextResponse.json({ error: error?.message || "Erreur mise à jour" }, { status: 500 });
  }
}

// DELETE: Supprimer un template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    const { id } = await params;

    const existing = await prisma.emailTemplate.findUnique({
      where: { id },
      include: { _count: { select: { sends: true } } }
    });

    if (!existing) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    // Si des envois existent, archiver plutôt que supprimer
    if (existing._count.sends > 0) {
      await prisma.emailTemplate.update({
        where: { id },
        data: { status: EmailTemplateStatus.ARCHIVED }
      });
      return NextResponse.json({ message: "Template archivé (envois existants)" });
    }

    // Supprimer le template et ses versions
    await prisma.$transaction([
      prisma.emailTemplateVersion.deleteMany({ where: { templateId: id } }),
      prisma.emailTemplate.delete({ where: { id } })
    ]);

    return NextResponse.json({ message: "Template supprimé" });
  } catch (error: any) {
    console.error("[api/admin/emails/templates/[id]] DELETE error:", error);
    return NextResponse.json({ error: error?.message || "Erreur suppression" }, { status: 500 });
  }
}
