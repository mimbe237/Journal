"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExportButtons } from "@/modules/admin/components/ExportButtons";

interface DashboardStats {
  users: {
    total: number;
    newToday: number;
    newWeek: number;
    newMonth: number;
    activeSessions: number;
  };
  subscriptions: {
    total: number;
    active: number;
    byType: Record<string, number>;
    expiringSoon7: number;
    expiringSoon30: number;
  };
  revenue: {
    currentMonth: number;
    lastMonth: number;
  };
  editions: {
    total: number;
    latest: { titre: string; datePublication: Date } | null;
    mostRead: { titre: string; sessions: number } | null;
    avgCompletion: number;
  };
  promoCodes: {
    active: number;
    totalUsage: number;
  };
  recent: {
    users: Array<{
      id: string;
      nom: string;
      email: string;
      dateCreation: Date;
      subscriptions: Array<{ type: string }>;
    }>;
    sessions: Array<{
      id: string;
      dateHeureDebut: Date;
      pageFin: number | null;
      user: { nom: string };
      edition: { titre: string; nombrePages: number | null };
    }>;
    activity: Array<{
      id: string;
      type: string;
      dateDebut: Date;
      user: { nom: string; email: string };
    }>;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard/stats")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Stats reçues:", data);
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Chargement des statistiques...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-600">Erreur de chargement des données</div>
      </div>
    );
  }

  const revenueCurrentRaw = stats.revenue?.currentMonth;
  const revenueCurrent = revenueCurrentRaw === undefined || revenueCurrentRaw === null ? 0 : Number(revenueCurrentRaw);
  const revenueLastRaw = stats.revenue?.lastMonth;
  const revenueLast = revenueLastRaw === undefined || revenueLastRaw === null ? null : Number(revenueLastRaw);
  const revenueChange =
    revenueLast && revenueLast > 0 ? ((revenueCurrent - revenueLast) / revenueLast) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
        <PageHeader
          title="Tableau de bord Administrateur"
          subtitle="Vue globale du système"
        />

        {/* KPIs Utilisateurs */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">👥 Utilisateurs</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="text-sm text-slate-600">Total inscrits</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.users.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600">Nouveaux aujourd'hui</div>
              <div className="text-3xl font-bold text-emerald-600 mt-2">{stats.users.newToday}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600">Cette semaine</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.users.newWeek}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600">Lectures en cours</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{stats.users.activeSessions}</div>
            </Card>
          </div>
        </div>

        {/* KPIs Abonnements */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">💳 Abonnements</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <div className="text-sm text-slate-600">Actifs</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.subscriptions.active}</div>
              <div className="text-xs text-slate-500 mt-1">sur {stats.subscriptions.total} total</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600">Mensuels</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.subscriptions.byType.MENSUEL || 0}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600">Annuels</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.subscriptions.byType.ANNUEL || 0}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600">Expirent sous 7j</div>
              <div className="text-3xl font-bold text-orange-600 mt-2">{stats.subscriptions.expiringSoon7}</div>
              <div className="text-xs text-slate-500 mt-1">{stats.subscriptions.expiringSoon30} sous 30j</div>
            </Card>
          </div>
        </div>

        {/* Revenus & Éditions */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">💰 Revenus</h2>
            <Card className="p-6">
              <div className="text-sm text-slate-600">Revenus ce mois</div>
              <div className="text-4xl font-bold text-slate-900 mt-2">
                {revenueCurrent.toLocaleString("fr-FR")} FCFA
              </div>
              {revenueLast !== null && (
                <>
                  <div className={`text-sm mt-2 ${revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? '↗' : '↘'} {Math.abs(revenueChange).toFixed(1)}% vs mois dernier
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Mois dernier: {revenueLast.toLocaleString("fr-FR")} FCFA
                  </div>
                </>
              )}
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📰 Éditions</h2>
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm text-slate-600">Total publiées</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">{stats.editions.total}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-600">Complétion moyenne</div>
                  <div className="text-3xl font-bold text-blue-600 mt-1">{stats.editions.avgCompletion}%</div>
                </div>
              </div>
              {stats.editions.latest && (
                <div className="border-t border-slate-200 pt-3">
                  <div className="text-xs text-slate-600">Dernière édition</div>
                  <div className="text-sm font-medium text-slate-900">{stats.editions.latest.titre}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(stats.editions.latest.datePublication).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Codes Promo */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🎟️ Codes Promo</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="text-sm text-slate-600">Codes actifs</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.promoCodes.active}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600">Utilisations totales</div>
              <div className="text-3xl font-bold text-slate-900 mt-2">{stats.promoCodes.totalUsage}</div>
            </Card>
          </div>
        </div>

        {/* Alertes */}
        {(stats.subscriptions.expiringSoon7 > 0) && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-orange-900">Alertes</div>
                <div className="text-sm text-orange-700">
                  {stats.subscriptions.expiringSoon7} abonnement(s) expire(nt) dans les 7 prochains jours
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Listes récentes */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Derniers utilisateurs */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">🆕 Derniers inscrits</h2>
            <Card className="p-4">
              <div className="space-y-3">
                {stats.recent.users.map((user) => (
                  <div key={user.id} className="flex justify-between items-start border-b border-slate-100 pb-2 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 text-sm">{user.nom}</div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-600">
                        {new Date(user.dateCreation).toLocaleDateString("fr-FR")}
                      </div>
                      <div className="text-xs text-emerald-600">
                        {user.subscriptions[0]?.type || "Sans abonnement"}
                      </div>
                    </div>
                  </div>
                ))}
                {stats.recent.users.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-4">Aucun utilisateur récent</div>
                )}
              </div>
            </Card>
          </div>

          {/* Dernières sessions */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">📖 Sessions de lecture récentes</h2>
            <Card className="p-4">
              <div className="space-y-3">
                {stats.recent.sessions.map((session) => {
                  const progress = session.edition.nombrePages
                    ? Math.round(((session.pageFin || 0) / session.edition.nombrePages) * 100)
                    : 0;
                  return (
                    <div key={session.id} className="border-b border-slate-100 pb-2 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm">{session.user.nom}</div>
                          <div className="text-xs text-slate-600">{session.edition.titre}</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(session.dateHeureDebut).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <div className="mt-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{progress}% complété</div>
                    </div>
                  );
                })}
                {stats.recent.sessions.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-4">Aucune session récente</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Actions rapides */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">⚡ Actions rapides</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <Link href="/admin/editions">
              <Card className="p-4 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer">
                <div className="text-center">
                  <div className="text-2xl mb-2">📰</div>
                  <div className="text-sm font-medium text-slate-900">Nouvelle édition</div>
                </div>
              </Card>
            </Link>
            <Link href="/admin/promocodes">
              <Card className="p-4 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎟️</div>
                  <div className="text-sm font-medium text-slate-900">Code promo</div>
                </div>
              </Card>
            </Link>
            <Link href="/admin/subscriptions">
              <Card className="p-4 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer">
                <div className="text-center">
                  <div className="text-2xl mb-2">💳</div>
                  <div className="text-sm font-medium text-slate-900">Abonnements</div>
                </div>
              </Card>
            </Link>
            <Card className="p-4 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <ExportButtons />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
