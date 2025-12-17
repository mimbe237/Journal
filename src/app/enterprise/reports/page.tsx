'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { StatCard, StatIcons } from '@/components/admin/StatCard';
import { SimpleBarChart, SimpleLineChart, SimpleDonutChart } from '@/components/admin/Charts';

interface EnterpriseStats {
  totalUsers: number;
  activeUsers: number;
  maxUsers: number;
  totalReadingSessions: number;
  avgReadingTime: number;
  mostReadEditions: { name: string; count: number }[];
  readingByDay: { label: string; value: number }[];
  usersByStatus: { label: string; value: number; color: string }[];
}

export default function EnterpriseReportsPage() {
  const [stats, setStats] = useState<EnterpriseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/enterprise/reports?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching enterprise stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={"/enterprise" as Route}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Rapports d'activité</h1>
              <p className="mt-1 text-slate-600">
                Analysez l'utilisation de la plateforme par vos collaborateurs
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'week', label: 'Semaine' },
                { value: 'month', label: 'Mois' },
                { value: 'year', label: 'Année' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value as typeof period)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                    period === option.value
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Utilisateurs actifs"
            value={loading ? '...' : `${stats?.activeUsers ?? 0} / ${stats?.maxUsers ?? 0}`}
            icon={StatIcons.Users}
            color="blue"
            loading={loading}
            subtitle="Ce mois"
          />
          <StatCard
            title="Sessions de lecture"
            value={loading ? '...' : stats?.totalReadingSessions ?? 0}
            icon={StatIcons.Editions}
            color="emerald"
            loading={loading}
            subtitle="Total période"
          />
          <StatCard
            title="Temps moyen de lecture"
            value={loading ? '...' : `${stats?.avgReadingTime ?? 0} min`}
            icon={StatIcons.Clock}
            color="amber"
            loading={loading}
            subtitle="Par session"
          />
          <StatCard
            title="Taux d'utilisation"
            value={loading ? '...' : `${stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%`}
            icon={StatIcons.Activity}
            color="purple"
            loading={loading}
            subtitle="Utilisateurs actifs"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Reading Activity */}
          <SimpleLineChart
            title="Activité de lecture"
            data={stats?.readingByDay || []}
            color="emerald"
            loading={loading}
          />

          {/* Users by Status */}
          <SimpleDonutChart
            title="Répartition des utilisateurs"
            data={stats?.usersByStatus || [
              { label: 'Actifs', value: 0, color: '#10b981' },
              { label: 'Inactifs', value: 0, color: '#94a3b8' },
            ]}
            loading={loading}
          />
        </div>

        {/* Most Read Editions */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Éditions les plus lues</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          ) : stats?.mostReadEditions?.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Aucune lecture enregistrée pour cette période
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats?.mostReadEditions?.map((edition, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="font-medium text-slate-900">{edition.name}</span>
                  </div>
                  <span className="text-sm text-slate-500">
                    {edition.count} lecture{edition.count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              window.open(`/api/enterprise/reports/export?period=${period}`, '_blank');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exporter le rapport
          </button>
        </div>
      </div>
    </div>
  );
}
