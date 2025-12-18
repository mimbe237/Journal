import { prisma } from "@/lib/config/prisma";
import { SystemEventType, UserRole } from "@prisma/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

type LogWithUser = {
  id: string;
  typeEvenement: SystemEventType;
  userId: string | null;
  ip: string | null;
  createdAt: Date;
  meta: any;
  user?: {
    nom: string;
    email: string;
    role: UserRole;
  } | null;
};

const allowedTypes: SystemEventType[] = [
  SystemEventType.CREATION_ABONNEMENT,
  SystemEventType.MODIFICATION_ABONNEMENT,
  SystemEventType.SUPPRESSION_ABONNEMENT,
  SystemEventType.SUPPRESSION_DEFINITIVE_ABONNEMENT,
  SystemEventType.RESTAURATION_ABONNEMENT
];

export default async function LogsPage() {
  let logs: LogWithUser[] = [];
  let loadError: string | null = null;

  try {
    logs = await prisma.systemEvent.findMany({
      include: {
        user: {
          select: {
            nom: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    logs = logs.filter((log) => allowedTypes.includes(log.typeEvenement));
  } catch (error: any) {
    console.error("[admin/logs] failed to load system events", error);
    loadError = error?.message ?? "Impossible de charger les événements.";
  }

  const getActionLabel = (type: SystemEventType) => {
    switch (type) {
      case "CREATION_ABONNEMENT": return "Création";
      case "MODIFICATION_ABONNEMENT": return "Modification";
      case "SUPPRESSION_ABONNEMENT": return "Mise à la corbeille";
      case "SUPPRESSION_DEFINITIVE_ABONNEMENT": return "Suppression définitive";
      case "RESTAURATION_ABONNEMENT": return "Restauration";
      default: return type;
    }
  };

  const getActionColor = (type: SystemEventType) => {
    switch (type) {
      case "CREATION_ABONNEMENT": return "bg-green-100 text-green-800";
      case "MODIFICATION_ABONNEMENT": return "bg-blue-100 text-blue-800";
      case "SUPPRESSION_ABONNEMENT": return "bg-orange-100 text-orange-800";
      case "SUPPRESSION_DEFINITIVE_ABONNEMENT": return "bg-red-100 text-red-800";
      case "RESTAURATION_ABONNEMENT": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatType = (type?: string) => {
    switch (type) {
      case "MENSUEL": return "Mensuel";
      case "TRIMESTRIEL": return "Trimestriel";
      case "SEMESTRIEL": return "Semestriel";
      case "ANNUEL": return "Annuel";
      default: return type || "";
    }
  };

  const shorten = (id?: string, size = 10) => {
    if (!id) return "";
    if (id.length <= size) return id;
    const head = id.slice(0, Math.floor(size / 2));
    const tail = id.slice(-Math.floor(size / 2));
    return `${head}…${tail}`;
  };

  const buildDetail = (log: LogWithUser) => {
    const meta = (log.meta || {}) as Record<string, any>;
    const chips: { label: string; value?: string | number | boolean }[] = [];
    const addChip = (label: string, value?: any) => {
      if (value === undefined || value === null || value === "") return;
      chips.push({ label, value });
    };

    let title = "";
    let subtitle = "";

    if (log.typeEvenement === "CREATION_ABONNEMENT") {
      title = meta.free ? "Création d'un abonnement gratuit" : "Création d'un abonnement";
      if (meta.type) title += ` ${formatType(meta.type)}`;
      if (meta.targetUserId) subtitle = `Compte ${shorten(meta.targetUserId)}`;
      addChip("Statut", meta.statut);
      addChip("Source", meta.source);
      addChip("Type", formatType(meta.type));
      addChip("Promo", meta.promoCodeId);
      addChip("Gratuit", meta.free ? "Oui" : undefined);
    } else if (log.typeEvenement === "MODIFICATION_ABONNEMENT") {
      title = "Mise à jour abonnement";
      if (meta.changes?.from && meta.changes?.to) {
        const { from, to } = meta.changes;
        if (from.statut && to.statut && from.statut !== to.statut) {
          subtitle = `Statut ${from.statut} → ${to.statut}`;
        } else if (from.type && to.type && from.type !== to.type) {
          subtitle = `Type ${formatType(from.type)} → ${formatType(to.type)}`;
        }
      }
      addChip("Abonnement", shorten(meta.subscriptionId));
      addChip("Compte", shorten(meta.targetUserId));
    } else if (log.typeEvenement === "SUPPRESSION_ABONNEMENT") {
      title = "Abonnement mis à la corbeille";
      subtitle = meta.trashedUntil ? `Restauration possible jusqu'au ${format(new Date(meta.trashedUntil), "dd MMM yyyy", { locale: fr })}` : "";
      addChip("Abonnement", shorten(meta.subscriptionId));
      addChip("Compte", shorten(meta.targetUserId));
    } else if (log.typeEvenement === "SUPPRESSION_DEFINITIVE_ABONNEMENT") {
      title = "Abonnement supprimé définitivement";
      addChip("Abonnement", shorten(meta.subscriptionId));
      addChip("Compte", shorten(meta.targetUserId));
    } else if (log.typeEvenement === "RESTAURATION_ABONNEMENT") {
      title = "Abonnement restauré";
      addChip("Abonnement", shorten(meta.subscriptionId));
      addChip("Compte", shorten(meta.targetUserId));
    } else {
      title = meta.appEventType || "Détail indisponible";
    }

    // Fallback si rien n'est ressorti
    if (!title && meta.appEventType) title = meta.appEventType;

    return { title, subtitle, chips, raw: meta };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Journal des activités" 
        description="Historique des modifications sur les abonnements"
      />

      <Card className="overflow-hidden">
        {loadError ? (
          <div className="px-6 py-4 text-sm text-red-700 bg-red-50 border-b border-red-100">
            Impossible de charger le journal d'activité. {loadError}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Utilisateur (Staff)</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                    {format(log.createdAt, "dd MMM yyyy HH:mm", { locale: fr })}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {log.user?.nom || log.user?.email || "Système"}
                    <div className="text-xs text-slate-400 font-normal">{log.user?.role}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.typeEvenement)}`}>
                      {getActionLabel(log.typeEvenement)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-700 max-w-md">
                    {(() => {
                      const detail = buildDetail(log);
                      return (
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900">{detail.title || "Détail indisponible"}</div>
                          {detail.subtitle ? (
                            <div className="text-xs text-slate-500">{detail.subtitle}</div>
                          ) : null}
                          {detail.chips.length > 0 ? (
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              {detail.chips.map((chip, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                                  <span className="font-semibold">{chip.label}:</span>
                                  <span>{String(chip.value)}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                          {detail.raw && Object.keys(detail.raw).length > 0 ? (
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              {JSON.stringify(detail.raw)}
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
              {(!loadError && logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Aucune activité enregistrée.
                  </td>
                </tr>
              )}
              {loadError && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Réessaie plus tard ou contacte le support.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
