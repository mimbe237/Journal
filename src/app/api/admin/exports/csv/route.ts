import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

type ExportType = "users" | "subscriptions" | "reading-sessions";

function csvEscape(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const head = headers.map(csvEscape).join(";");
  const body = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  return `${head}\n${body}`;
}

export async function GET(req: NextRequest) {
  try {
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") ?? "") as ExportType;

    if (!["users", "subscriptions", "reading-sessions"].includes(type)) {
      return NextResponse.json({ error: "Paramètre type invalide" }, { status: 400 });
    }

    if (type === "users") {
      const users = await prisma.user.findMany({
        include: { enterpriseAccount: true }
      });
      const csv = buildCsv(
        ["id", "nom", "email", "role", "dateCreation", "enterpriseAccountId", "enterpriseName"],
        users.map((u) => [
          u.id,
          u.nom,
          u.email,
          u.role,
          u.dateCreation.toISOString(),
          u.enterpriseAccountId,
          u.enterpriseAccount?.nom
        ])
      );
      return sendCsv(csv, "users-export.csv");
    }

    if (type === "subscriptions") {
      const subs = await prisma.subscription.findMany({
        include: {
          user: true,
          enterpriseAccount: true,
          promoCode: true
        }
      });
      const csv = buildCsv(
        [
          "id",
          "type",
          "statut",
          "dateDebut",
          "dateFin",
          "montant",
          "devise",
          "source",
          "userEmail",
          "enterpriseName",
          "promoCode"
        ],
        subs.map((s) => [
          s.id,
          s.type,
          s.statut,
          s.dateDebut.toISOString(),
          s.dateFin.toISOString(),
          s.montant.toString(),
          s.devise,
          s.source,
          s.user?.email,
          s.enterpriseAccount?.nom,
          s.promoCode?.code
        ])
      );
      return sendCsv(csv, "subscriptions-export.csv");
    }

    // reading-sessions
    const sessions = await prisma.readingSession.findMany({
      include: {
        user: true,
        edition: true
      }
    });
    const csv = buildCsv(
      [
        "sessionId",
        "userEmail",
        "editionId",
        "editionTitre",
        "pageDebut",
        "pageFin",
        "dateHeureDebut",
        "dateHeureFin",
        "adresseIp",
        "userAgent"
      ],
      sessions.map((s) => [
        s.id,
        s.user?.email,
        s.editionId,
        s.edition?.titre,
        s.pageDebut,
        s.pageFin,
        s.dateHeureDebut.toISOString(),
        s.dateHeureFin.toISOString(),
        s.adresseIp,
        s.userAgent
      ])
    );
    return sendCsv(csv, "reading-sessions-export.csv");
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de l'export" }, { status: 400 });
  }
}

function sendCsv(csv: string, filename: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`
    }
  });
}
