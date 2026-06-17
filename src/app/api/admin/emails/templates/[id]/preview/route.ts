import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";
import { renderTemplate, getSampleTokenValues, TokenValues } from "@/modules/emails";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

// POST: Prévisualiser un template avec des données
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);
    const { id } = await params;

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      include: { layout: true }
    });

    if (!template) {
      return NextResponse.json({ error: "Template non trouvé" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const values: TokenValues = body.values || getSampleTokenValues();

    const rendered = await renderTemplate(template, values);

    return NextResponse.json({
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    });
  } catch (error: any) {
    console.error("[api/admin/emails/templates/[id]/preview] POST error:", error);
    return NextResponse.json({ error: error?.message || "Erreur prévisualisation" }, { status: 500 });
  }
}
