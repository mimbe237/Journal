import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/emails/automations/[id] - Détails d'une automatisation
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const automation = await prisma.emailAutomation.findUnique({
    where: { id },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          nom: true,
          status: true,
          sujet: true,
        },
      },
    },
  });

  if (!automation) {
    return NextResponse.json(
      { error: 'Automatisation non trouvée' },
      { status: 404 }
    );
  }

  return NextResponse.json(automation);
}

// PATCH /api/admin/emails/automations/[id] - Modifier une automatisation
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { templateId, delayMinutes, conditions, active } = body;

    const existing = await prisma.emailAutomation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Automatisation non trouvée' },
        { status: 404 }
      );
    }

    // Si on change le template, vérifier qu'il existe
    if (templateId && templateId !== existing.templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) {
        return NextResponse.json(
          { error: 'Template non trouvé' },
          { status: 404 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (templateId !== undefined) updateData.templateId = templateId;
    if (delayMinutes !== undefined) updateData.delayMinutes = delayMinutes;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (active !== undefined) updateData.active = active;

    const automation = await prisma.emailAutomation.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            slug: true,
            nom: true,
          },
        },
      },
    });

    return NextResponse.json(automation);
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/emails/automations/[id] - Supprimer une automatisation
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const existing = await prisma.emailAutomation.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Automatisation non trouvée' },
      { status: 404 }
    );
  }

  await prisma.emailAutomation.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
