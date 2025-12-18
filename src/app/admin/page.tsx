import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadAdminDashboardStats } from "@/lib/admin/dashboardStats";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole } from "@prisma/client";

// Page strictement dynamique (cookies nécessaires pour l'auth staff).
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const numberFormatter = new Intl.NumberFormat("fr-FR");
const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XAF",
  maximumFractionDigits: 0
});
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(date: Date) {
  return dateFormatter.format(date);
}

function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

export default async function AdminLandingPage() {
  const user = await getCurrentUser();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isFacturation = user?.role === UserRole.FACTURATION;
  const isSupport = user?.role === UserRole.SUPPORT;

  let stats = null;
  try {
    stats = await loadAdminDashboardStats();
  } catch (error) {
    console.error("Erreur lors de la collecte des statistiques admin", error);
    stats = null;
  }

  const revenueDelta = stats ? stats.revenue.currentMonth - stats.revenue.lastMonth : 0;
  const revenuePercentChange =
    stats && stats.revenue.lastMonth ? Math.round((revenueDelta / stats.revenue.lastMonth) * 100) : null;

  const summaryCards = stats
    ? [
        {
          label: "Abonnés actifs",
          value: formatNumber(stats.subscriptions.active),
          detail: `${formatNumber(stats.users.total)} utilisateurs enregistrés`
        },
        {
          label: "Nouveaux abonnés (7j)",
          value: formatNumber(stats.users.newWeek),
          detail: `${formatNumber(stats.users.newToday)} aujourd'hui`
        },
        {
          label: "Sessions actives",
          value: formatNumber(stats.users.activeSessions),
          detail: "Données des 30 dernières minutes"
        },
        {
          label: "Revenu ce mois",
          value: formatCurrency(stats.revenue.currentMonth),
          detail:
            revenuePercentChange !== null
              ? `${revenuePercentChange >= 0 ? "+" : ""}${revenuePercentChange}% vs. mois précédent`
              : `Mois précédent ${formatCurrency(stats.revenue.lastMonth)}`
        }
      ]
    : [];

  const quickLinks = [];
  
  if (isSuperAdmin) {
    quickLinks.push(
      { href: "/admin/editions/bulk-import", label: "Import en masse" },
      { href: "/admin/editions/list", label: "Gérer les éditions" },
      { href: "/admin/subscribers", label: "Abonnés" },
      { href: "/admin/exports", label: "Exports" },
      { href: "/admin/promocodes", label: "Codes promo" }
    );
  } else if (isFacturation) {
    quickLinks.push(
      { href: "/admin/facturation/soumissions", label: "Soumissions" },
      { href: "/admin/subscriptions", label: "Abonnements" },
      { href: "/admin/exports", label: "Exports" }
    );
  } else if (isSupport) {
    quickLinks.push(
      { href: "/admin/facturation/soumissions", label: "Soumissions" },
      { href: "/admin/users", label: "Utilisateurs" },
      { href: "/admin/editions/list", label: "Gérer les éditions" },
      { href: "/admin/enterprises", label: "Entreprises" }
    );
  }

  return (
    <div className="space-y-6 px-6 py-8">
      <PageHeader
        title="Tableau de bord administratif"
        subtitle="Surveillez l'état des abonnements, le trafic lecture et lancez rapidement les actions importantes."
        actions={
          isSuperAdmin ? (
            <Link
              href="/admin/editions/bulk-import"
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 shadow-sm shadow-emerald-900/10 hover:bg-emerald-100"
            >
              Importer en masse
            </Link>
          ) : null
        }
      />

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Accès rapide</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href as any}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:shadow"
            >
              <span>{link.label}</span>
              <span aria-hidden className="text-emerald-600">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      {stats ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Indicateurs clés</h2>
            <span className="text-xs text-slate-500">Mis à jour en continu</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.label} className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-400">{card.label}</p>
                <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.detail}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">Éditions</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(stats.editions.total)} éditions</p>
              {stats.editions.latest && (
                <p className="text-sm text-slate-500">
                  Dernière publication : {stats.editions.latest.titre} ({formatDate(stats.editions.latest.datePublication)})
                </p>
              )}
              {stats.editions.mostRead && (
                <p className="text-sm text-slate-500">
                  {stats.editions.mostRead.titre ?? "Édition inconnue"} — {formatNumber(stats.editions.mostRead.sessions)} lectures
                </p>
              )}
              <p className="text-sm text-slate-500">Taux moyen de lecture : {stats.editions.avgCompletion}%</p>
            </Card>

            <Card className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">Promotions & échéances</p>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Codes promo actifs</span>
                <span className="font-semibold text-emerald-600">{formatNumber(stats.promoCodes.active)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Utilisations promos</span>
                <span className="font-semibold text-slate-900">{formatNumber(stats.promoCodes.totalUsage)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>
                  Abonnements expirant <span className="font-semibold text-slate-900">7j</span>
                </span>
                <span className="font-semibold text-amber-600">{formatNumber(stats.subscriptions.expiringSoon7)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>
                  Expirations <span className="font-semibold text-slate-900">30j</span>
                </span>
                <span className="font-semibold text-amber-500">{formatNumber(stats.subscriptions.expiringSoon30)}</span>
              </div>
              <div className="text-xs text-slate-500">
                {Object.entries(stats.subscriptions.byType)
                  .map(([type, count]) => `${type}: ${formatNumber(count)}`)
                  .join(" • ")}
              </div>
            </Card>

            <Card className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-slate-400">Sessions et lectures</p>
              <p className="text-sm text-slate-500">Pages lues récemment et trafic de lecture.</p>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Taux de complétion moyen</span>
                <span className="font-semibold text-slate-900">{stats.editions.avgCompletion}%</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Sessions actives</span>
                <span className="font-semibold text-emerald-600">{formatNumber(stats.users.activeSessions)}</span>
              </div>
              <div className="text-xs text-slate-500">
                Données calculées sur les {stats.recent.sessions.length} dernières sessions enregistrées.
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-slate-400">Nouveaux utilisateurs</p>
                <span className="text-xs text-slate-500">Dernières inscriptions</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                {stats.recent.users.map((user) => (
                  <li key={user.id} className="flex flex-col gap-0">
                    <span className="font-semibold text-slate-900">{user.nom || user.email}</span>
                    <span className="text-xs text-slate-500">
                      {user.subscriptions[0]?.type ?? "Sans abonnement actif"} • {formatDate(user.dateCreation)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-slate-400">Sessions récentes</p>
                <span className="text-xs text-slate-500">Trafic lecture</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                {stats.recent.sessions.map((session) => (
                  <li key={session.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {session.edition?.titre ?? "Édition inconnue"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {session.user?.nom ?? "Anonyme"} • {formatDateTime(session.dateHeureDebut)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-slate-900">
                      {session.pageFin ?? 0}/{session.edition?.nombrePages ?? "-"}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      ) : (
        <Card className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Impossible de charger les indicateurs pour le moment. Essaie de recharger la page ou vérifie les logs.
        </Card>
      )}
    </div>
  );
}
