'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

interface EnterpriseStats {
  totalLicenses: number;
  usedLicenses: number;
  pendingInvites: number;
  availableLicenses: number;
  activeUsers: number;
  suspendedUsers: number;
}

interface EnterpriseUser {
  id: string;
  nom: string;
  email: string;
  role?: string;
  enterpriseRole?: string;
  enterpriseStatus?: string;
  dateAssignmentEnterprise?: string;
  dernierLoginAt?: string;
}

interface Invitation {
  id: string;
  email: string;
  createdAt: string;
  expireAt: string;
}

interface EnterpriseData {
  enterprise: {
    id: string;
    nom: string;
    contactEmail: string;
    nombreUtilisateursInclus: number;
    niveauSla: string;
    actif: boolean;
  };
  users: EnterpriseUser[];
  pendingInvitations: Invitation[] | number;
  subscriptions: Array<{
    id: string;
    type: string;
    statut: string;
    dateDebut: string;
    dateFin: string;
    journalType?: { id: string; nom: string; code: string };
  }>;
  stats?: EnterpriseStats;
  currentUserRole?: string;
  isAdmin: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN_PRIMAIRE: 'Admin Primaire',
  ADMIN_SECONDAIRE: 'Admin Secondaire',
  MANAGER: 'Manager',
  UTILISATEUR: 'Utilisateur',
  SUSPENDU: 'Suspendu',
  COMPTE_ENTREPRISE: 'Administrateur'
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN_PRIMAIRE: 'bg-purple-100 text-purple-800',
  ADMIN_SECONDAIRE: 'bg-indigo-100 text-indigo-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  UTILISATEUR: 'bg-green-100 text-green-800',
  SUSPENDU: 'bg-red-100 text-red-800',
  COMPTE_ENTREPRISE: 'bg-purple-100 text-purple-800'
};

const STATUS_COLORS: Record<string, string> = {
  ACTIF: 'text-green-600',
  SUSPENDU: 'text-red-600',
  INVITE: 'text-amber-600',
  SUPPRIME: 'text-gray-400'
};

export default function EnterpriseDashboardPage() {
  const [data, setData] = useState<EnterpriseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/enterprise/dashboard');
      if (!res.ok) {
        if (res.status === 403) {
          setError("Vous n'avez pas accès à cette page. Seuls les administrateurs d'entreprise peuvent y accéder.");
          return;
        }
        throw new Error('Erreur de chargement');
      }
      const data = await res.json();
      setData(data);
    } catch (err) {
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment suspendre cet utilisateur ? Il perdra son accès aux éditions.')) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`/api/enterprise/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Suspendu par un administrateur' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la suspension');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suspension');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/enterprise/users/${userId}/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'UTILISATEUR' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la réactivation');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la réactivation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Voulez-vous vraiment annuler cette invitation ?')) return;

    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/enterprise/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur lors de l\'annulation');
      fetchData();
    } catch (err) {
      alert('Erreur lors de l\'annulation de l\'invitation');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <LoadingState message="Chargement du tableau de bord..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState title="Aucune donnée" message="Impossible de charger les données" />;

  // Calculer les stats depuis l'API ou les données locales
  const pendingCount = Array.isArray(data.pendingInvitations) 
    ? data.pendingInvitations.length 
    : (data.pendingInvitations || 0);
  
  const stats = data.stats || {
    totalLicenses: data.enterprise.nombreUtilisateursInclus,
    usedLicenses: data.users.length,
    pendingInvites: pendingCount,
    availableLicenses: data.enterprise.nombreUtilisateursInclus - data.users.length - pendingCount,
    activeUsers: data.users.filter(u => u.enterpriseStatus !== 'SUSPENDU').length,
    suspendedUsers: data.users.filter(u => u.enterpriseStatus === 'SUSPENDU').length
  };

  const canManageUsers = data.isAdmin;
  const activeSubscription = data.subscriptions?.find(s => s.statut === 'ACTIF');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <PageHeader 
          title={`Tableau de bord - ${data.enterprise.nom}`}
          description={data.currentUserRole ? `Vous êtes ${ROLE_LABELS[data.currentUserRole] || data.currentUserRole}` : "Gérez les utilisateurs de votre entreprise"}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Utilisateurs actifs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Licences disponibles</p>
                <p className="text-3xl font-bold text-gray-900">{stats.availableLicenses}</p>
                <p className="text-xs text-gray-400">sur {stats.totalLicenses}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Invitations en attente</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingInvites}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Utilisateurs suspendus</p>
                <p className="text-3xl font-bold text-gray-900">{stats.suspendedUsers}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Subscription Status */}
        {activeSubscription && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Votre abonnement actif</h3>
                <p className="text-blue-100 capitalize">
                  {activeSubscription.type} 
                  {activeSubscription.journalType && ` - ${activeSubscription.journalType.nom}`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Expire le</p>
                <p className="text-xl font-bold">
                  {new Date(activeSubscription.dateFin).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Users Management */}
        {canManageUsers && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Utilisateurs de l'entreprise</h2>
              <Button 
                onClick={() => setShowInviteModal(true)}
                disabled={stats.availableLicenses <= 0}
              >
                + Inviter un utilisateur
              </Button>
            </div>

            {stats.availableLicenses <= 0 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800">
                  Toutes vos licences sont utilisées. Contactez l'administrateur pour augmenter le nombre de licences.
                </p>
              </div>
            )}

            {/* Pending Invitations */}
            {Array.isArray(data.pendingInvitations) && data.pendingInvitations.length > 0 && (
              <Card className="mb-6 overflow-hidden">
                <div className="p-4 bg-amber-50 border-b border-amber-100">
                  <h3 className="font-medium text-amber-800">Invitations en attente</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {data.pendingInvitations.map((inv) => (
                    <div key={inv.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{inv.email}</p>
                        <p className="text-sm text-gray-500">
                          Expire le {new Date(inv.expireAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(inv.id)}
                        disabled={actionLoading === inv.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === inv.id ? '...' : 'Annuler'}
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Utilisateur</th>
                    <th className="text-left p-4 font-medium text-gray-700">Rôle</th>
                    <th className="text-left p-4 font-medium text-gray-700">Statut</th>
                    <th className="text-left p-4 font-medium text-gray-700">Dernière connexion</th>
                    <th className="text-right p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Aucun utilisateur. Invitez des membres de votre équipe.
                      </td>
                    </tr>
                  ) : (
                    data.users.map((user) => {
                      const userRole = user.enterpriseRole || user.role || 'UTILISATEUR';
                      const userStatus = user.enterpriseStatus || 'ACTIF';
                      const isAdminPrimaire = userRole === 'ADMIN_PRIMAIRE';
                      const isSuspended = userStatus === 'SUSPENDU' || userRole === 'SUSPENDU';
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{user.nom}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ROLE_COLORS[userRole] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {ROLE_LABELS[userRole] || userRole}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={STATUS_COLORS[userStatus] || 'text-gray-600'}>
                              {userStatus === 'ACTIF' ? '● Actif' : 
                               userStatus === 'SUSPENDU' ? '● Suspendu' : 
                               userStatus}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500">
                            {user.dernierLoginAt 
                              ? new Date(user.dernierLoginAt).toLocaleString('fr-FR')
                              : 'Jamais'
                            }
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {!isAdminPrimaire && (
                              <>
                                {isSuspended ? (
                                  <button
                                    onClick={() => handleReactivateUser(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                                  >
                                    {actionLoading === user.id ? '...' : 'Réactiver'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSuspendUser(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                                  >
                                    {actionLoading === user.id ? '...' : 'Suspendre'}
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Card>
          </>
        )}

        {/* Non-admin view */}
        {!canManageUsers && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bienvenue</h2>
            <p className="text-gray-600">
              Vous faites partie de l'entreprise <strong>{data.enterprise.nom}</strong>.
              Accédez aux éditions disponibles via le menu.
            </p>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/editions" className="block">
              <h3 className="font-semibold text-gray-900 mb-2">📚 Accéder aux éditions</h3>
              <p className="text-sm text-gray-500">Consulter toutes les éditions disponibles</p>
            </Link>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/profile" className="block">
              <h3 className="font-semibold text-gray-900 mb-2">👤 Mon profil</h3>
              <p className="text-sm text-gray-500">Gérer vos informations personnelles</p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <a href={`mailto:support@journal.com`} className="block">
              <h3 className="font-semibold text-gray-900 mb-2">💬 Contacter le support</h3>
              <p className="text-sm text-gray-500">Obtenir de l'aide pour votre compte</p>
            </a>
          </Card>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal
          availableLicenses={stats.availableLicenses}
          currentUserRole={data.currentUserRole}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function InviteUserModal({ 
  availableLicenses,
  currentUserRole,
  onClose, 
  onInvited 
}: { 
  availableLicenses: number;
  currentUserRole?: string;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('UTILISATEUR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rôles disponibles selon le rôle de l'utilisateur actuel
  const availableRoles = currentUserRole === 'ADMIN_PRIMAIRE'
    ? ['UTILISATEUR', 'MANAGER', 'ADMIN_SECONDAIRE']
    : ['UTILISATEUR', 'MANAGER'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (availableLicenses <= 0) {
      setError('Plus de licences disponibles');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/enterprise/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'invitation');
      }

      onInvited();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Inviter un collaborateur</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email du collaborateur
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="collaborateur@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === 'ADMIN_SECONDAIRE' && 'Peut gérer les utilisateurs et les rôles'}
              {role === 'MANAGER' && 'Peut inviter et gérer les utilisateurs'}
              {role === 'UTILISATEUR' && 'Accès en lecture aux éditions'}
            </p>
          </div>

          <p className="text-sm text-gray-500">
            Un email d'invitation sera envoyé. L'invitation expire après 7 jours.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || availableLicenses <= 0}>
              {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
