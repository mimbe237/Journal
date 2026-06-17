"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface AdStats {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  overallCtr: number;
  totalBudgetSpent: number;
  byChannel: {
    channel: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
  topCampaigns: {
    id: string;
    name: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
}

export default function AdvertisingDashboardPage() {
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/advertising/stats");
      if (!res.ok) throw new Error("Erreur lors du chargement des statistiques");
      const data = await res.json();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publicités</h1>
        <p className="text-gray-600">
          Gérez vos campagnes publicitaires et suivez les performances.
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm font-medium text-gray-500 mb-1">Campagnes actives</p>
          <div className="text-2xl font-bold text-green-600">
            {stats?.activeCampaigns || 0}
          </div>
          <p className="text-xs text-gray-500">
            sur {stats?.totalCampaigns || 0} au total
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500 mb-1">Impressions (30j)</p>
          <div className="text-2xl font-bold">
            {(stats?.totalImpressions || 0).toLocaleString("fr-FR")}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500 mb-1">Clics (30j)</p>
          <div className="text-2xl font-bold">
            {(stats?.totalClicks || 0).toLocaleString("fr-FR")}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500 mb-1">CTR moyen</p>
          <div className="text-2xl font-bold text-blue-600">
            {(stats?.overallCtr || 0).toFixed(2)}%
          </div>
        </Card>
      </div>

      {/* Performance par canal */}
      {stats?.byChannel && stats.byChannel.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Performance par canal</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Canal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Impressions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Clics
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    CTR
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.byChannel.map((ch) => (
                  <tr key={ch.channel}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatChannelName(ch.channel)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {ch.impressions.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {ch.clicks.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {ch.ctr.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Top campagnes */}
      {stats?.topCampaigns && stats.topCampaigns.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Top 5 campagnes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Campagne
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Impressions
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Clics
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    CTR
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topCampaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {c.impressions.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {c.clicks.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                      {c.ctr.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Message si pas de données */}
      {(!stats?.totalCampaigns || stats.totalCampaigns === 0) && (
        <Card className="py-12 text-center">
          <p className="text-gray-500 mb-4">
            Aucune campagne publicitaire configurée.
          </p>
          <a
            href="/admin/advertising/campaigns"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Créer une campagne
          </a>
        </Card>
      )}
    </div>
  );
}

function formatChannelName(channel: string): string {
  const names: Record<string, string> = {
    EMAIL_EDITION: "Email Édition",
    EMAIL_NEWSLETTER: "Newsletter",
    IN_APP_BANNER: "Bannière In-App",
  };
  return names[channel] || channel;
}
