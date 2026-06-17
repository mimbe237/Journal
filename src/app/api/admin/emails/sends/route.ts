import { NextRequest, NextResponse } from "next/server";
import { UserRole, Prisma, EmailSendStatus } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";
import { getEmailStats } from "@/modules/emails";

const ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];

// GET: Logs d'envoi avec filtres et pagination
export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, ALLOWED_ROLES);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
    const templateId = searchParams.get("templateId");
    const status = searchParams.get("status") as EmailSendStatus | null;
    const email = searchParams.get("email");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Prisma.EmailSendWhereInput = {};
    if (templateId) where.templateId = templateId;
    if (status) where.status = status;
    if (email) where.recipientEmail = { contains: email, mode: "insensitive" };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [sends, total] = await Promise.all([
      prisma.emailSend.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          template: { select: { id: true, nom: true, slug: true } }
        }
      }),
      prisma.emailSend.count({ where })
    ]);

    return NextResponse.json({
      sends,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error: any) {
    console.error("[api/admin/emails/sends] GET error:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
