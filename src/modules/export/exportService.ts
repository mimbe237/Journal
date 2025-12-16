import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/config/prisma";
import { buildSubscriptionWhere, SubscriptionFilterInput } from "./subscriptionFilters";

// Helper CSV simple (séparateur ; compatible Excel FR).
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

// Abonnés (inclut les comptes entreprise & utilisateurs entreprise).
export async function exportSubscribersCsv(): Promise<string> {
  const users = await prisma.user.findMany({
    include: { enterpriseAccount: true },
    orderBy: { dateCreation: "desc" }
  });

  // Récupère l'abonnement individuel actif s'il existe (simplifié).
  const userSubs = await prisma.subscription.findMany({
    where: { userId: { in: users.map((u) => u.id) }, statut: "ACTIF" },
    orderBy: { dateFin: "desc" }
  });
  const subByUser = new Map<string, Prisma.SubscriptionGetPayload<{}>>();
  userSubs.forEach((s) => {
    if (!subByUser.has(s.userId!)) subByUser.set(s.userId!, s as any);
  });

  const rows = users.map((u) => {
    const sub = subByUser.get(u.id);
    const statut = sub ? sub.statut : "AUCUN";
    const dateDebut = sub ? sub.dateDebut.toISOString() : "";
    const dateFin = sub ? sub.dateFin.toISOString() : "";
    return [u.id, u.nom, u.email, u.role, statut, dateDebut, dateFin, u.enterpriseAccount?.nom];
  });

  return buildCsv(
    ["id", "nom", "email", "role", "statutAbonnement", "dateDebutAbonnement", "dateFinAbonnement", "entreprise"],
    rows
  );
}

// Abonnements (B2C + B2B)
export async function exportSubscriptionsCsv(filters?: SubscriptionFilterInput): Promise<string> {
  const where = buildSubscriptionWhere(filters || {});

  const subs = await prisma.subscription.findMany({
    where,
    include: { user: true, enterpriseAccount: true, promoCode: true },
    orderBy: { dateFin: "desc" }
  });

  const rows = subs.map((s) => [
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
  ]);

  return buildCsv(
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
      "entreprise",
      "codePromo"
    ],
    rows
  );
}

// Statistiques de lecture (ReadingSession).
export async function exportReadingStatsCsv(params?: { from?: Date; to?: Date }): Promise<string> {
  const where: Prisma.ReadingSessionWhereInput = {};
  if (params?.from) where.dateHeureDebut = { gte: params.from };
  if (params?.to) where.dateHeureFin = { lte: params.to };

  const sessions = await prisma.readingSession.findMany({
    where,
    include: { user: true, edition: true },
    orderBy: { dateHeureDebut: "desc" }
  });

  const rows = sessions.map((s) => {
    const dureeMs = (s.dateHeureFin?.getTime() ?? s.dateHeureDebut.getTime()) - s.dateHeureDebut.getTime();
    const dureeSec = Math.max(0, Math.round(dureeMs / 1000));
    const pagesLues = Math.max(1, s.pageFin - s.pageDebut + 1);
    return [
      s.id,
      s.user?.email,
      s.editionId,
      s.edition?.titre,
      s.pageDebut,
      s.pageFin,
      s.dateHeureDebut.toISOString(),
      s.dateHeureFin?.toISOString() ?? "",
      dureeSec,
      pagesLues,
      s.adresseIp,
      s.userAgent
    ];
  });

  return buildCsv(
    [
      "sessionId",
      "userEmail",
      "editionId",
      "editionTitre",
      "pageDebut",
      "pageFin",
      "dateHeureDebut",
      "dateHeureFin",
      "dureeSec",
      "pagesLues",
      "adresseIp",
      "userAgent"
    ],
    rows
  );
}
