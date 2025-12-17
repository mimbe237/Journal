'use client';

import { useEffect, useState } from 'react';
import { StatCard, StatIcons } from './StatCard';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalEditions: number;
  pendingPayments: number;
  enterprises: number;
  trends: {
    users: number;
    subscriptions: number;
    revenue: number;
  };
}

interface StatsGridProps {
  initialStats?: Partial<DashboardStats>;
}

export function StatsGrid({ initialStats }: StatsGridProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        // Use initial stats as fallback or mock data for demo
        setStats({
          totalUsers: initialStats?.totalUsers ?? 0,
          activeSubscriptions: initialStats?.activeSubscriptions ?? 0,
          monthlyRevenue: initialStats?.monthlyRevenue ?? 0,
          totalEditions: initialStats?.totalEditions ?? 0,
          pendingPayments: initialStats?.pendingPayments ?? 0,
          enterprises: initialStats?.enterprises ?? 0,
          trends: {
            users: 12,
            subscriptions: 8,
            revenue: 15,
          },
        });
        setError('Erreur de chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [initialStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' XAF';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <StatCard
        title="Utilisateurs totaux"
        value={loading ? '...' : formatNumber(stats?.totalUsers ?? 0)}
        icon={StatIcons.Users}
        color="blue"
        loading={loading}
        trend={stats?.trends.users ? {
          value: stats.trends.users,
          isPositive: stats.trends.users > 0,
          label: 'ce mois'
        } : undefined}
      />

      <StatCard
        title="Abonnements actifs"
        value={loading ? '...' : formatNumber(stats?.activeSubscriptions ?? 0)}
        icon={StatIcons.Subscriptions}
        color="emerald"
        loading={loading}
        trend={stats?.trends.subscriptions ? {
          value: stats.trends.subscriptions,
          isPositive: stats.trends.subscriptions > 0,
          label: 'ce mois'
        } : undefined}
      />

      <StatCard
        title="Revenus du mois"
        value={loading ? '...' : formatCurrency(stats?.monthlyRevenue ?? 0)}
        icon={StatIcons.Revenue}
        color="amber"
        loading={loading}
        trend={stats?.trends.revenue ? {
          value: stats.trends.revenue,
          isPositive: stats.trends.revenue > 0,
          label: 'vs mois dernier'
        } : undefined}
      />

      <StatCard
        title="Éditions publiées"
        value={loading ? '...' : formatNumber(stats?.totalEditions ?? 0)}
        icon={StatIcons.Editions}
        color="purple"
        loading={loading}
        subtitle="Total publié"
      />

      <StatCard
        title="Paiements en attente"
        value={loading ? '...' : formatNumber(stats?.pendingPayments ?? 0)}
        icon={StatIcons.Clock}
        color={stats?.pendingPayments && stats.pendingPayments > 0 ? 'red' : 'slate'}
        loading={loading}
        subtitle="À valider"
      />

      <StatCard
        title="Comptes entreprise"
        value={loading ? '...' : formatNumber(stats?.enterprises ?? 0)}
        icon={StatIcons.Enterprise}
        color="blue"
        loading={loading}
        subtitle="Entreprises actives"
      />
    </div>
  );
}

export default StatsGrid;
