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
                  <td className="px-6 py-3 text-slate-500 max-w-md truncate">
                    {JSON.stringify(log.meta)}
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
