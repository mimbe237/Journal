import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { UserRole } from "@prisma/client";
import { startOfYear, endOfYear, eachMonthOfInterval, format } from "date-fns";
import { fr } from "date-fns/locale";

export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [
      UserRole.SUPER_ADMIN,
      UserRole.FACTURATION,
      UserRole.SUPPORT
    ]);

    // Get current year range
    const now = new Date();
    const startDate = startOfYear(now);
    const endDate = endOfYear(now);

    // Fetch subscriptions created this year
    const subscriptions = await prisma.subscription.findMany({
      where: {
        dateDebut: {
          gte: startDate,
          lte: endDate
        },
        statut: {
          not: "SUSPENDU" // Exclude suspended? Or maybe include all active/expired that were paid.
        }
      },
      select: {
        dateDebut: true,
        montant: true,
        devise: true
      }
    });

    // Group by month
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    const stats = months.map(month => {
      const monthKey = format(month, "yyyy-MM");
      const monthLabel = format(month, "MMM", { locale: fr });
      
      const subsInMonth = subscriptions.filter(s => 
        format(s.dateDebut, "yyyy-MM") === monthKey
      );

      const total = subsInMonth.reduce((acc, curr) => acc + Number(curr.montant), 0);
      
      return {
        month: monthLabel,
        fullDate: monthKey,
        revenue: total,
        count: subsInMonth.length
      };
    });

    return NextResponse.json({ data: stats });

  } catch (error: any) {
    console.error("Error fetching revenue stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
