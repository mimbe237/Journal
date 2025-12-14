'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { getUserRole, softDeleteSubscription, restoreSubscription, hardDeleteSubscription } from './actions';
import { UserRole } from '@prisma/client';

interface Subscription {
  id: string;
  type: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  devise: string;
  source: string;
  deletedAt?: string | null;
  trashedUntil?: string | null;
  user?: {
    id: string;
    nom: string;
    email: string;
  };
  enterpriseAccount?: {
    id: string;
    nom: string;
  };
  promoCode?: {
    code: string;
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ACTIF' | 'EXPIRE' | 'ANNULE'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'MENSUEL' | 'ANNUEL'>('all');
  const [view, setView] = useState<'active' | 'trash'>('active');
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);

  useEffect(() => {
    getUserRole().then(setUserRole);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [view]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/subscriptions?view=${view}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError('Impossible de charger les abonnements');
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir mettre cet abonnement à la corbeille ?")) return;
    const res = await softDeleteSubscription(id);
    if (res.success) fetchSubscriptions();
    else alert(res.error);
  };

  const handleRestore = async (id: string) => {
    const res = await restoreSubscription(id);
    if (res.success) fetchSubscriptions();
    else alert(res.error);
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("ATTENTION : Cette action est irréversible. Voulez-vous vraiment supprimer définitivement cet abonnement ?")) return;
    const res = await hardDeleteSubscription(id);
    if (res.success) fetchSubscriptions();
    else alert(res.error);
  };

  const canEdit = userRole === 'SUPPORT' || userRole === 'SUPER_ADMIN';

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter !== 'all' && sub.statut !== filter) return false;
    if (typeFilter !== 'all' && sub.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: subscriptions.length,
    actifs: subscriptions.filter(s => s.statut === 'ACTIF').length,
    expires: subscriptions.filter(s => s.statut === 'EXPIRE').length,
    annules: subscriptions.filter(s => s.statut === 'ANNULE').length,
    mensuel: subscriptions.filter(s => s.type === 'MENSUEL').length,
    annuel: subscriptions.filter(s => s.type === 'ANNUEL').length,
    revenuTotal: subscriptions
      .filter(s => s.statut === 'ACTIF')
      .reduce((acc, s) => acc + Number(s.montant), 0),
  };

  if (loading) return <LoadingState message="Chargement des abonnements..." />;
  if (error) return <ErrorState message={error} onRetry={fetchSubscriptions} />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Gestion des Abonnements" 
        description="Suivez et gérez tous les abonnements de la plateforme"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white">
          <p className="text-sm text-gray-500">Total Abonnements</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4 bg-green-50">
          <p className="text-sm text-green-600">Actifs</p>
          <p className="text-2xl font-bold text-green-900">{stats.actifs}</p>
        </Card>
        <Card className="p-4 bg-blue-50">
          <p className="text-sm text-blue-600">Revenu Mensuel Actif</p>
          <p className="text-2xl font-bold text-blue-900">
            {stats.revenuTotal.toLocaleString('fr-FR')} FCFA
          </p>
        </Card>
        <Card className="p-4 bg-purple-50">
          <p className="text-sm text-purple-600">Taux Annuel</p>
          <p className="text-2xl font-bold text-purple-900">
            {stats.total > 0 ? Math.round((stats.annuel / stats.total) * 100) : 0}%
          </p>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setView('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === 'active' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Actifs
          </button>
          <button
            onClick={() => setView('trash')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === 'trash' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Corbeille
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6 bg-white">
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Statut:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Tous</option>
              <option value="ACTIF">Actifs</option>
              <option value="EXPIRE">Expirés</option>
              <option value="ANNULE">Annulés</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Tous</option>
              <option value="MENSUEL">Mensuel</option>
              <option value="ANNUEL">Annuel</option>
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            {filteredSubscriptions.length} résultat(s)
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      {filteredSubscriptions.length === 0 ? (
        <EmptyState 
          title="Aucun abonnement trouvé"
          message="Aucun abonnement ne correspond aux filtres sélectionnés"
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Client</th>
                  <th className="text-left p-4 font-medium text-gray-700">Type</th>
                  <th className="text-left p-4 font-medium text-gray-700">Période</th>
                  <th className="text-right p-4 font-medium text-gray-700">Montant</th>
                  <th className="text-center p-4 font-medium text-gray-700">Statut</th>
                  <th className="text-center p-4 font-medium text-gray-700">Source</th>
                  <th className="text-right p-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      {sub.user ? (
                        <div>
                          <div className="font-medium text-gray-900">{sub.user.nom}</div>
                          <div className="text-sm text-gray-500">{sub.user.email}</div>
                        </div>
                      ) : sub.enterpriseAccount ? (
                        <div>
                          <div className="font-medium text-gray-900">{sub.enterpriseAccount.nom}</div>
                          <div className="text-sm text-gray-500">Compte entreprise</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.type === 'ANNUEL' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sub.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900">
                        {new Date(sub.dateDebut).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        → {new Date(sub.dateFin).toLocaleDateString('fr-FR')}
                      </div>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {view === 'active' ? (
                          <>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Détails
                            </button>
                            {canEdit && (
                              <button 
                                onClick={() => handleSoftDelete(sub.id)}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                              >
                                Supprimer
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {canEdit && (
                              <>
                                <button 
                                  onClick={() => handleRestore(sub.id)}
                                  className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                >
                                  Restaurer
                                </button>
                                <button 
                                  onClick={() => handleHardDelete(sub.id)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                  Supprimer définitivement
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>iv>
                      {sub.promoCode && (
                        <div className="text-xs text-green-600">
                          Code: {sub.promoCode.code}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.statut === 'ACTIF' 
                          ? 'bg-green-100 text-green-800'
                          : sub.statut === 'EXPIRE'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.statut}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs text-gray-600">{sub.source}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Détails →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
