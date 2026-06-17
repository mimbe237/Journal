import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { sendTestEmail } from "@/modules/emails";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

// POST: Envoyer un email de test
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);
    const { id } = await params;

    const body = await req.json();
    const { testEmail, values } = body;

    if (!testEmail) {
      return NextResponse.json({ error: "Email de test requis" }, { status: 400 });
    }

    const sendId = await sendTestEmail({
      templateId: id,
      testEmail,
      customValues: values
    });

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${testEmail}`,
      sendId
    });
  } catch (error: any) {
    console.error("[api/admin/emails/templates/[id]/test] POST error:", error);
    return NextResponse.json({ error: error?.message || "Erreur envoi test" }, { status: 500 });
  }
}
