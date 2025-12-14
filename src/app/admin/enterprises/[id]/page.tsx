'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/States';

interface EnterpriseAccount {
  id: string;
  nom: string;
  contactEmail: string;
  contactTelephone?: string;
  nombreUtilisateursInclus: number;
  dateCreation: string;
  actif: boolean;
  niveauSla?: string;
  ssoEnabled: boolean;
  ssoProvider?: string;
  domaineAutorise?: string;
  restrictionIp: boolean;
  plagesIpAutorisees: string[];
  adresseFacturation?: string;
  numeroSiret?: string;
  contactDedieEmail?: string;
  contactDedieTelephone?: string;
  notes?: string;
  users: Array<{
    id: string;
    nom: string;
    email: string;
    role: string;
    dernierLoginAt?: string;
  }>;
  subscriptions: Array<{
    id: string;
    type: string;
    statut: string;
    dateDebut: string;
    dateFin: string;
    montant: number;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    expireAt: string;
    acceptedAt?: string;
    createdAt: string;
  }>;
}

export default function EnterpriseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [enterprise, setEnterprise] = useState<EnterpriseAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'subscriptions' | 'settings' | 'security'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);

  useEffect(() => {
    fetchEnterprise();
  }, [id]);

  const fetchEnterprise = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/enterprises/${id}`);
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setEnterprise(data.enterprise);
    } catch (err) {
      setError('Impossible de charger le compte entreprise');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Voulez-vous vraiment retirer cet utilisateur de l\'entreprise ?')) return;

    try {
      const res = await fetch(`/api/admin/enterprises/${id}/remove-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error('Erreur lors de la suppression');
      fetchEnterprise();
    } catch (err) {
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleValidateInvitation = async (invitationId: string) => {
    if (!confirm('Voulez-vous valider cette invitation ?')) return;

    try {
      const res = await fetch(`/api/admin/enterprises/${id}/invitations/${invitationId}`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la validation');
      }
      alert('Invitation validée avec succès !');
      fetchEnterprise();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la validation de l\'invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Voulez-vous annuler cette invitation ?')) return;

    try {
      const res = await fetch(`/api/admin/enterprises/${id}/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur lors de l\'annulation');
      fetchEnterprise();
    } catch (err) {
      alert('Erreur lors de l\'annulation de l\'invitation');
    }
  };

  const handleToggleActive = async () => {
    if (!enterprise) return;
    
    try {
      const res = await fetch(`/api/admin/enterprises/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !enterprise.actif }),
      });

      if (!res.ok) throw new Error('Erreur lors de la mise à jour');
      fetchEnterprise();
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  if (loading) return <LoadingState message="Chargement du compte entreprise..." />;
  if (error || !enterprise) return <ErrorState message={error || 'Entreprise non trouvée'} onRetry={fetchEnterprise} />;

  const usersCount = enterprise.users.length;
  const licensesRemaining = enterprise.nombreUtilisateursInclus - usersCount;
  const pendingInvitations = enterprise.invitations.filter(i => !i.acceptedAt).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/enterprises" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Retour aux entreprises
        </Link>
      </div>

      <PageHeader 
        title={enterprise.nom}
        description={`Compte entreprise créé le ${new Date(enterprise.dateCreation).toLocaleDateString('fr-FR')}`}
      >
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowEditModal(true)}>
            Modifier
          </Button>
          <Button 
            variant={enterprise.actif ? 'danger' : 'primary'}
            onClick={handleToggleActive}
          >
            {enterprise.actif ? 'Désactiver' : 'Activer'}
          </Button>
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Utilisateurs</p>
          <p className="text-2xl font-bold">{usersCount} / {enterprise.nombreUtilisateursInclus}</p>
          <p className="text-xs text-gray-400">{licensesRemaining} licences disponibles</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Invitations en attente</p>
          <p className="text-2xl font-bold">{pendingInvitations}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Niveau SLA</p>
          <p className="text-2xl font-bold capitalize">{enterprise.niveauSla || 'Standard'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Statut</p>
          <p className={`text-2xl font-bold ${enterprise.actif ? 'text-green-600' : 'text-red-600'}`}>
            {enterprise.actif ? 'Actif' : 'Inactif'}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          {[
            { key: 'users', label: 'Utilisateurs' },
            { key: 'subscriptions', label: 'Abonnements' },
            { key: 'security', label: 'Sécurité' },
            { key: 'settings', label: 'Paramètres' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <UsersTab 
          enterprise={enterprise}
          onInvite={() => setShowInviteModal(true)}
          onRemoveUser={handleRemoveUser}
          onCancelInvitation={handleCancelInvitation}
          onValidateInvitation={handleValidateInvitation}
        />
      )}
      {activeTab === 'subscriptions' && (
        <SubscriptionsTab 
          enterprise={enterprise} 
          onAdd={() => setShowAddSubscriptionModal(true)} 
        />
      )}

      {activeTab === 'security' && (
        <SecurityTab enterprise={enterprise} onUpdate={fetchEnterprise} />
      )}

      {activeTab === 'settings' && (
        <SettingsTab enterprise={enterprise} onUpdate={fetchEnterprise} />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteUserModal
          enterpriseId={id}
          licensesRemaining={licensesRemaining - pendingInvitations}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false);
            fetchEnterprise();
          }}
        />
      )}
      {showAddSubscriptionModal && (
        <AddSubscriptionModal
          enterpriseId={id}
          onClose={() => setShowAddSubscriptionModal(false)}
          onCreated={() => {
            setShowAddSubscriptionModal(false);
            fetchEnterprise();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditEnterpriseModal
          enterprise={enterprise}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            fetchEnterprise();
          }}
        />
      )}
    </div>
  );
}

// ============================================
// USERS TAB
// ============================================
function UsersTab({ 
  enterprise, 
  onInvite, 
  onRemoveUser,
  onCancelInvitation,
  onValidateInvitation
}: { 
  enterprise: EnterpriseAccount;
  onInvite: () => void;
  onRemoveUser: (userId: string) => void;
  onCancelInvitation: (invitationId: string) => void;
  onValidateInvitation: (invitationId: string) => void;
}) {
  const pendingInvitations = enterprise.invitations.filter(i => !i.acceptedAt);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Utilisateurs ({enterprise.users.length})</h3>
        <Button onClick={onInvite} disabled={enterprise.users.length >= enterprise.nombreUtilisateursInclus}>
          + Inviter un utilisateur
        </Button>
      </div>

      {/* Users List */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">Utilisateur</th>
              <th className="text-left p-4 font-medium text-gray-700">Rôle</th>
              <th className="text-left p-4 font-medium text-gray-700">Dernière connexion</th>
              <th className="text-right p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enterprise.users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Aucun utilisateur dans cette entreprise
                </td>
              </tr>
            ) : (
              enterprise.users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{user.nom}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'COMPTE_ENTREPRISE' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'COMPTE_ENTREPRISE' ? 'Administrateur' : 'Utilisateur'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {user.dernierLoginAt 
                      ? new Date(user.dernierLoginAt).toLocaleString('fr-FR')
                      : 'Jamais'
                    }
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => onRemoveUser(user.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Retirer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">Invitations en attente ({pendingInvitations.length})</h3>
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Email</th>
                  <th className="text-left p-4 font-medium text-gray-700">Rôle</th>
                  <th className="text-left p-4 font-medium text-gray-700">Expire le</th>
                  <th className="text-right p-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-900">{invitation.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invitation.role === 'COMPTE_ENTREPRISE' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {invitation.role === 'COMPTE_ENTREPRISE' ? 'Administrateur' : 'Utilisateur'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(invitation.expireAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 text-right space-x-2 flex justify-end">
                      <button
                        onClick={() => onValidateInvitation(invitation.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => onCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Annuler
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================
// SUBSCRIPTIONS TAB
// ============================================
function SubscriptionsTab({ enterprise, onAdd }: { enterprise: EnterpriseAccount; onAdd: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Abonnements</h3>
        <Button onClick={onAdd}>+ Nouvel abonnement</Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">Type</th>
              <th className="text-left p-4 font-medium text-gray-700">Période</th>
              <th className="text-left p-4 font-medium text-gray-700">Montant</th>
              <th className="text-center p-4 font-medium text-gray-700">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enterprise.subscriptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Aucun abonnement pour cette entreprise
                </td>
              </tr>
            ) : (
              enterprise.subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900 capitalize">{sub.type}</td>
                  <td className="p-4 text-gray-500">
                    {new Date(sub.dateDebut).toLocaleDateString('fr-FR')} - {new Date(sub.dateFin).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4 text-gray-900">
                    {Number(sub.montant).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.statut === 'ACTIF' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sub.statut}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================
// SECURITY TAB
// ============================================
function SecurityTab({ enterprise, onUpdate }: { enterprise: EnterpriseAccount; onUpdate: () => void }) {
  const [ssoConfig, setSsoConfig] = useState({
    ssoEnabled: enterprise.ssoEnabled,
    ssoProvider: enterprise.ssoProvider || '',
    domaineAutorise: enterprise.domaineAutorise || '',
    restrictionIp: enterprise.restrictionIp,
    plagesIpAutorisees: enterprise.plagesIpAutorisees.join('\n'),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssoEnabled: ssoConfig.ssoEnabled,
          ssoProvider: ssoConfig.ssoProvider || null,
          domaineAutorise: ssoConfig.domaineAutorise || null,
          restrictionIp: ssoConfig.restrictionIp,
          plagesIpAutorisees: ssoConfig.plagesIpAutorisees.split('\n').filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
      onUpdate();
      alert('Paramètres de sécurité mis à jour');
    } catch (err) {
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Paramètres de sécurité</h3>

      <Card className="p-6 space-y-6">
        {/* SSO Configuration */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Single Sign-On (SSO)</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={ssoConfig.ssoEnabled}
                onChange={(e) => setSsoConfig({ ...ssoConfig, ssoEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span>Activer SSO</span>
            </label>

            {ssoConfig.ssoEnabled && (
              <div className="ml-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur SSO
                  </label>
                  <select
                    value={ssoConfig.ssoProvider}
                    onChange={(e) => setSsoConfig({ ...ssoConfig, ssoProvider: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="google">Google Workspace</option>
                    <option value="microsoft">Microsoft Azure AD</option>
                    <option value="saml">SAML 2.0 personnalisé</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Domain Restriction */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Restriction de domaine</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domaine email autorisé
            </label>
            <input
              type="text"
              value={ssoConfig.domaineAutorise}
              onChange={(e) => setSsoConfig({ ...ssoConfig, domaineAutorise: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="@entreprise.com"
            />
            <p className="text-sm text-gray-500 mt-1">
              Seuls les emails avec ce domaine pourront rejoindre l'entreprise
            </p>
          </div>
        </div>

        {/* IP Restriction */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Restriction par IP</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={ssoConfig.restrictionIp}
                onChange={(e) => setSsoConfig({ ...ssoConfig, restrictionIp: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span>Activer la restriction par IP</span>
            </label>

            {ssoConfig.restrictionIp && (
              <div className="ml-8">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plages IP autorisées (une par ligne)
                </label>
                <textarea
                  value={ssoConfig.plagesIpAutorisees}
                  onChange={(e) => setSsoConfig({ ...ssoConfig, plagesIpAutorisees: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// SETTINGS TAB
// ============================================
function SettingsTab({ enterprise, onUpdate }: { enterprise: EnterpriseAccount; onUpdate: () => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Informations de l'entreprise</h3>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Contact principal</h4>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="font-medium">{enterprise.contactEmail}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Téléphone</dt>
              <dd className="font-medium">{enterprise.contactTelephone || '-'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Contact dédié (Support)</h4>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="font-medium">{enterprise.contactDedieEmail || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Téléphone</dt>
              <dd className="font-medium">{enterprise.contactDedieTelephone || '-'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Facturation</h4>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-gray-500">SIRET / RC</dt>
              <dd className="font-medium">{enterprise.numeroSiret || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Adresse de facturation</dt>
              <dd className="font-medium whitespace-pre-wrap">{enterprise.adresseFacturation || '-'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Notes internes</h4>
          <p className="text-gray-600 whitespace-pre-wrap">
            {enterprise.notes || 'Aucune note'}
          </p>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// INVITE USER MODAL
// ============================================
function InviteUserModal({ 
  enterpriseId, 
  licensesRemaining,
  onClose, 
  onInvited 
}: { 
  enterpriseId: string;
  licensesRemaining: number;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'UTILISATEUR_ENTREPRISE',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (licensesRemaining <= 0) {
      setError('Plus de licences disponibles');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/enterprises/${enterpriseId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
          <h2 className="text-xl font-semibold">Inviter un utilisateur</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {licensesRemaining <= 0 && (
            <div className="p-3 bg-amber-50 text-amber-700 rounded-lg text-sm">
              Plus de licences disponibles. Augmentez le nombre de licences pour inviter de nouveaux utilisateurs.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de l'utilisateur *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="utilisateur@entreprise.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UTILISATEUR_ENTREPRISE">Utilisateur</option>
              <option value="COMPTE_ENTREPRISE">Administrateur</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Les administrateurs peuvent gérer les utilisateurs de l'entreprise
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || licensesRemaining <= 0}>
              {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// ADD SUBSCRIPTION MODAL
// ============================================
function AddSubscriptionModal({
  enterpriseId,
  onClose,
  onCreated
}: {
  enterpriseId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const defaultEnd = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    type: 'ANNUEL',
    dateDebut: defaultStart,
    dateFin: defaultEnd,
    montant: '0',
    devise: 'FCFA',
    source: 'OFFLINE',
    promoCodeId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const montantNumber = Number(form.montant);
    const startDate = new Date(form.dateDebut);
    const endDate = new Date(form.dateFin);

    if (Number.isNaN(montantNumber) || montantNumber < 0) {
      setError('Montant invalide');
      return;
    }
    if (!(startDate < endDate)) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/create-for-enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterpriseAccountId: enterpriseId,
          type: form.type,
          dateDebut: form.dateDebut,
          dateFin: form.dateFin,
          montant: montantNumber,
          devise: form.devise,
          source: form.source,
          promoCodeId: form.promoCodeId || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la création de l'abonnement");
      }

      onCreated();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Nouvel abonnement</h2>
          <p className="text-sm text-gray-500 mt-1">Création manuelle pour le compte entreprise</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="MENSUEL">Mensuel</option>
                <option value="ANNUEL">Annuel</option>
                <option value="OFFERT">Offert</option>
                <option value="PROMOTIONNEL">Promotionnel</option>
                <option value="TEST">Test</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="OFFLINE">Offline</option>
                <option value="ONLINE">Online</option>
                <option value="CODE_PROMO">Code promo</option>
                <option value="PARTENARIAT">Partenariat</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={form.dateFin}
                onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
              <input
                type="number"
                min="0"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <input
                type="text"
                value={form.devise}
                onChange={(e) => setForm({ ...form, devise: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code promo (optionnel)</label>
            <input
              type="text"
              value={form.promoCodeId}
              onChange={(e) => setForm({ ...form, promoCodeId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="ID du code promo"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// EDIT ENTERPRISE MODAL
// ============================================
function EditEnterpriseModal({ 
  enterprise,
  onClose, 
  onUpdated 
}: { 
  enterprise: EnterpriseAccount;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [formData, setFormData] = useState({
    nom: enterprise.nom,
    contactEmail: enterprise.contactEmail,
    contactTelephone: enterprise.contactTelephone || '',
    nombreUtilisateursInclus: enterprise.nombreUtilisateursInclus,
    niveauSla: enterprise.niveauSla || 'standard',
    adresseFacturation: enterprise.adresseFacturation || '',
    numeroSiret: enterprise.numeroSiret || '',
    contactDedieEmail: enterprise.contactDedieEmail || '',
    contactDedieTelephone: enterprise.contactDedieTelephone || '',
    notes: enterprise.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Modifier l'entreprise</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'entreprise *
            </label>
            <input
              type="text"
              required
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contact *
              </label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.contactTelephone}
                onChange={(e) => setFormData({ ...formData, contactTelephone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de licences *
              </label>
              <input
                type="number"
                required
                min={enterprise.users.length}
                value={formData.nombreUtilisateursInclus}
                onChange={(e) => setFormData({ ...formData, nombreUtilisateursInclus: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum : {enterprise.users.length} (utilisateurs actuels)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau SLA
              </label>
              <select
                value={formData.niveauSla}
                onChange={(e) => setFormData({ ...formData, niveauSla: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email contact dédié
              </label>
              <input
                type="email"
                value={formData.contactDedieEmail}
                onChange={(e) => setFormData({ ...formData, contactDedieEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone contact dédié
              </label>
              <input
                type="tel"
                value={formData.contactDedieTelephone}
                onChange={(e) => setFormData({ ...formData, contactDedieTelephone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro SIRET / RC
            </label>
            <input
              type="text"
              value={formData.numeroSiret}
              onChange={(e) => setFormData({ ...formData, numeroSiret: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse de facturation
            </label>
            <textarea
              value={formData.adresseFacturation}
              onChange={(e) => setFormData({ ...formData, adresseFacturation: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes internes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Notes visibles uniquement par les administrateurs..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
