import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';

// GET /api/admin/emails/automations - Liste des automatisations
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const triggerType = searchParams.get('triggerType');
  const active = searchParams.get('active');

  const where: Record<string, unknown> = {};
  
  if (triggerType) {
    where.triggerType = triggerType;
  }
  
  if (active !== null && active !== '') {
    where.active = active === 'true';
  }

  const automations = await prisma.emailAutomation.findMany({
    where,
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          nom: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(automations);
}

// POST /api/admin/emails/automations - Créer une automatisation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { triggerType, templateId, delayMinutes, conditions, active, nom } = body;

    if (!triggerType || !templateId) {
      return NextResponse.json(
        { error: 'triggerType et templateId sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le template existe
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier s'il existe déjà une automatisation pour ce trigger
    const existing = await prisma.emailAutomation.findFirst({
      where: { triggerType },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Une automatisation existe déjà pour le trigger ${triggerType}` },
        { status: 400 }
      );
    }

    const automation = await prisma.emailAutomation.create({
      data: {
        nom: nom || `Automation ${triggerType}`,
        triggerType,
        templateId,
        delayMinutes: delayMinutes || 0,
        conditions: conditions || {},
        active: active ?? true,
      },
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

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}
