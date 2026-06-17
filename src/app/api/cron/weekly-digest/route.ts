import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { emailProvider } from "@/services/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Get users who want weekly summary
    const users = await prisma.user.findMany({
      where: {
        notificationPreferences: {
          summaryFrequency: "weekly",
        },
        email: { not: undefined },
      },
      select: {
        email: true,
        nom: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ message: "No users to notify" });
    }

    // 2. Get editions from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEditions = await prisma.edition.findMany({
      where: {
        datePublication: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        datePublication: "desc",
      },
      take: 5,
    });

    if (recentEditions.length === 0) {
      return NextResponse.json({ message: "No new editions this week" });
    }

    // 3. Send emails
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://journal.example.com";
    
    const results = await Promise.allSettled(
      users.map(async (user) => {
        const editionsList = recentEditions
          .map((e) => `- ${e.titre} (${new Date(e.datePublication).toLocaleDateString("fr-FR")})`)
          .join("\n");

        const htmlContent = `
          <div style="font-family: sans-serif; color: #333;">
            <h1>Bonjour ${user.nom},</h1>
            <p>Voici les éditions publiées cette semaine :</p>
            <ul>
              ${recentEditions
                .map(
                  (e) =>
                    `<li><a href="${appUrl}/editions/${e.id}" style="color: #059669; font-weight: bold;">${e.titre}</a> - ${new Date(
                      e.datePublication
                    ).toLocaleDateString("fr-FR")}</li>`
                )
                .join("")}
            </ul>
            <p>Bonne lecture !</p>
            <p><a href="${appUrl}/editions" style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder au kiosque</a></p>
          </div>
        `;

        await emailProvider.sendEmail({
          to: user.email,
          subject: "Votre résumé hebdomadaire des éditions",
          html: htmlContent,
          text: `Bonjour ${user.nom},\n\nVoici les éditions publiées cette semaine :\n${editionsList}\n\nBonne lecture !\n${appUrl}/editions`,
        });
      })
    );

    const sentCount = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({
      message: "Digest sent",
      sent: sentCount,
      total: users.length,
      editions: recentEditions.length,
    });
  } catch (error: any) {
    console.error("Weekly digest error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
