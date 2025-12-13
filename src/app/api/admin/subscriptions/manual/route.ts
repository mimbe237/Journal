import { NextRequest, NextResponse } from "next/server";
import { UserRole, SubmissionStatus } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";

export async function GET(req: NextRequest) {
  try {
    // Allow Facturation, Support, and Super Admin to view submissions
    await requireUserWithRoles(req, undefined, [
      UserRole.FACTURATION, 
      UserRole.SUPPORT, 
      UserRole.SUPER_ADMIN
    ]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as SubmissionStatus | null;
    const take = parseInt(searchParams.get("take") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where = status ? { statut: status } : {};

    const [submissions, total] = await Promise.all([
      prisma.manualSubscriptionSubmission.findMany({
        where,
        include: {
          justificatifs: true,
        },
        orderBy: {
          soumisA: "desc",
        },
        take,
        skip,
      }),
      prisma.manualSubscriptionSubmission.count({ where }),
    ]);

    return NextResponse.json({ 
      data: submissions, 
      meta: { total, take, skip } 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
