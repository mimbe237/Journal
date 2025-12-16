'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmailStats {
  total: number;
  byStatus: Record<string, number>;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  byTemplate: Array<{
    templateId: string;
    templateSlug: string;
    templateNom: string;
    count: number;
  }>;
}

interface RecentSend {
  id: string;
  recipientEmail: string;
  subject: string;
  status: string;
  createdAt: string;
  template: { slug: string; nom: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  SENT: 'bg-blue-500',
  DELIVERED: 'bg-green-500',
  OPENED: 'bg-purple-500',
  CLICKED: 'bg-indigo-500',
  BOUNCED: 'bg-orange-500',
  FAILED: 'bg-red-500',
  COMPLAINED: 'bg-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  SENT: 'Envoyés',
  DELIVERED: 'Délivrés',
  OPENED: 'Ouverts',
  CLICKED: 'Cliqués',
  BOUNCED: 'Rebondis',
  FAILED: 'Échoués',
  COMPLAINED: 'Plaintes',
};

function StatCard({ 
  label, 
  value, 
  suffix = '', 
  color = 'text-gray-900',
  subtext 
}: { 
  label: string; 
  value: number | string; 
  suffix?: string;
  color?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>
        {value}{suffix}
      </div>
      {subtext && (
        <div className="text-xs text-gray-400 mt-1">{subtext}</div>
      )}
    </div>
  );
}

function RateBar({ label, rate, color }: { label: string; rate: number; color: string }) {
  const safeRate = rate || 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{safeRate.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(safeRate, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function EmailDashboardPage() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [recentSends, setRecentSends] = useState<RecentSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsRes, sendsRes] = await Promise.all([
          fetch(`/api/admin/emails/stats?days=${period}`),
          fetch('/api/admin/emails/sends?pageSize=10'),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        } else {
          setStats({
            total: 0,
            byStatus: {},
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0,
            bounceRate: 0,
            byTemplate: [],
          });
        }
        if (sendsRes.ok) {
          const data = await sendsRes.json();
          setRecentSends(data.sends || []);
        } else {
          setRecentSends([]);
        }
      } catch (error) {
        console.error('Error fetching email dashboard:', error);
        setStats({
          total: 0,
          byStatus: {},
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0,
          byTemplate: [],
        });
        setRecentSends([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Emails</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d&apos;ensemble des envois et performances
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
          <Link
            href="/admin/emails/templates"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Gérer les templates
          </Link>
        </div>
      </div>

      {stats && (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard 
              label="Total envoyés" 
              value={stats.total} 
              color="text-blue-600"
            />
            <StatCard 
              label="Taux de délivrance" 
              value={(stats.deliveryRate || 0).toFixed(1)} 
              suffix="%"
              color={(stats.deliveryRate || 0) >= 95 ? 'text-green-600' : 'text-orange-600'}
            />
            <StatCard 
              label="Taux d'ouverture" 
              value={(stats.openRate || 0).toFixed(1)} 
              suffix="%"
              color={(stats.openRate || 0) >= 20 ? 'text-green-600' : 'text-gray-600'}
            />
            <StatCard 
              label="Taux de rebond" 
              value={(stats.bounceRate || 0).toFixed(1)} 
              suffix="%"
              color={(stats.bounceRate || 0) <= 2 ? 'text-green-600' : 'text-red-600'}
            />
          </div>

          {/* Performance bars */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Taux de performance</h2>
              <RateBar label="Délivrance" rate={stats.deliveryRate} color="bg-green-500" />
              <RateBar label="Ouverture" rate={stats.openRate} color="bg-purple-500" />
              <RateBar label="Clic" rate={stats.clickRate} color="bg-indigo-500" />
              <RateBar label="Rebond" rate={stats.bounceRate} color="bg-orange-500" />
            </div>

            {/* Status breakdown */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Répartition par statut</h2>
              <div className="space-y-2">
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status] || 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600">
                        {STATUS_LABELS[status] || status}
                      </span>
                    </div>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By template */}
          {stats.byTemplate.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Envois par template</h2>
              <div className="space-y-3">
                {stats.byTemplate.map((item) => (
                  <div key={item.templateId} className="flex items-center justify-between">
                    <div>
                      <Link 
                        href={`/admin/emails/templates/${item.templateId}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {item.templateNom}
                      </Link>
                      <span className="text-xs text-gray-400 ml-2">({item.templateSlug})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(item.count / stats.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent sends */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Derniers envois</h2>
          <Link 
            href="/admin/emails/logs"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Voir tous les logs →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentSends.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Aucun envoi récent
            </div>
          ) : (
            recentSends.map((send) => (
              <div key={send.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {send.recipientEmail}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {send.subject}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  {send.template && (
                    <span className="text-xs text-gray-400">
                      {send.template.slug}
                    </span>
                  )}
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    STATUS_COLORS[send.status] ? `${STATUS_COLORS[send.status]} text-white` : 'bg-gray-100 text-gray-800'
                  }`}>
                    {STATUS_LABELS[send.status] || send.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(send.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <Link 
          href="/admin/emails/templates/new"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="text-2xl mb-2">✉️</div>
          <div className="font-medium">Nouveau template</div>
          <div className="text-xs text-gray-500">Créer un modèle d&apos;email</div>
        </Link>
        <Link 
          href="/admin/emails/logs"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="text-2xl mb-2">📋</div>
          <div className="font-medium">Logs complets</div>
          <div className="text-xs text-gray-500">Historique des envois</div>
        </Link>
        <Link 
          href="/admin/emails/automations"
          className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-center"
        >
          <div className="text-2xl mb-2">⚡</div>
          <div className="font-medium">Automatisations</div>
          <div className="text-xs text-gray-500">Gérer les triggers</div>
        </Link>
      </div>
    </div>
  );
}
