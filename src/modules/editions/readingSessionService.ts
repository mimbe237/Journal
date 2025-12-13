import { ReadingSession } from "@prisma/client";
import { subMinutes } from "date-fns";
import { prisma } from "@/lib/config/prisma";
import { logSystemEvent } from "@/modules/logs/loggingService";

const SESSION_INACTIVITY_MINUTES = 30;

// Retourne la session récente (si l'utilisateur lit encore dans la fenêtre d'inactivité).
async function findRecentSession(userId: string, editionId: string, now: Date) {
  return prisma.readingSession.findFirst({
    where: {
      userId,
      editionId,
      dateHeureFin: { gte: subMinutes(now, SESSION_INACTIVITY_MINUTES) }
    },
    orderBy: { dateHeureFin: "desc" }
  });
}

// Démarre une session explicite (approche front recommandée).
export async function startReadingSession(params: {
  userId: string;
  editionId: string;
  pageDebut: number;
  adresseIp?: string | null;
  userAgent?: string | null;
}): Promise<ReadingSession> {
  const now = new Date();
  const page = Math.max(1, params.pageDebut);
  const session = await prisma.readingSession.create({
    data: {
      userId: params.userId,
      editionId: params.editionId,
      pageDebut: page,
      pageFin: page,
      dateHeureDebut: now,
      dateHeureFin: now,
      adresseIp: params.adresseIp ?? "",
      userAgent: params.userAgent ?? ""
    }
  });

  await logSystemEvent({
    type: "LECTURE_EDITION",
    userId: params.userId,
    ip: params.adresseIp ?? null,
    meta: { editionId: params.editionId, page: page, sessionId: session.id }
  });

  return session;
}

// Mise à jour d'une session existante lors du changement de page.
export async function updateReadingSessionOnPageView(params: {
  sessionId: string;
  pageNumber: number;
}): Promise<ReadingSession> {
  const session = await prisma.readingSession.findUnique({ where: { id: params.sessionId } });
  if (!session) throw new Error("Session introuvable");

  const page = Math.max(1, params.pageNumber);
  return prisma.readingSession.update({
    where: { id: params.sessionId },
    data: {
      pageDebut: Math.min(session.pageDebut, page),
      pageFin: Math.max(session.pageFin, page),
      dateHeureFin: new Date()
    }
  });
}

// Termine explicitement une session (peut être appelé au déchargement).
export async function endReadingSession(params: { sessionId: string }): Promise<ReadingSession> {
  const session = await prisma.readingSession.findUnique({ where: { id: params.sessionId } });
  if (!session) throw new Error("Session introuvable");

  return prisma.readingSession.update({
    where: { id: params.sessionId },
    data: { dateHeureFin: new Date() }
  });
}

/**
 * Fallback : enregistre une activité de lecture (mise à jour ou création) pour la route image,
 * regroupe les actions rapprochées dans une même session (fenêtre 30 minutes).
 * Reste utile si le front n'utilise pas explicitement start/update/end.
 */
export async function recordReadingActivity(params: {
  userId: string;
  editionId: string;
  pageNumber: number;
  adresseIp?: string | null;
  userAgent?: string | null;
}): Promise<ReadingSession> {
  const now = new Date();
  const existing = await findRecentSession(params.userId, params.editionId, now);

  const pageNumber = Math.max(1, params.pageNumber);

  if (!existing) {
    return startReadingSession({
      userId: params.userId,
      editionId: params.editionId,
      pageDebut: pageNumber,
      adresseIp: params.adresseIp,
      userAgent: params.userAgent
    });
  }

  const updated = await prisma.readingSession.update({
    where: { id: existing.id },
    data: {
      pageDebut: Math.min(existing.pageDebut, pageNumber),
      pageFin: Math.max(existing.pageFin, pageNumber),
      dateHeureFin: now,
      adresseIp: params.adresseIp ?? existing.adresseIp,
      userAgent: params.userAgent ?? existing.userAgent
    }
  });

  return updated;
}
