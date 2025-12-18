'use client';

import { useState, useEffect, use, useCallback } from 'react';
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
  licencesAchetees?: number;
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
  const [activeTab, setActiveTab] = useState<'users' | 'licenses' | 'subscriptions' | 'settings' | 'security'>('users');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);
  const [showPurchaseLicensesModal, setShowPurchaseLicensesModal] = useState(false);

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
            { key: 'licenses', label: 'Licences' },
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

      {activeTab === 'licenses' && (
        <LicensesTab 
          enterprise={enterprise}
          onPurchase={() => setShowPurchaseLicensesModal(true)}
          onUpdate={fetchEnterprise}
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
          enterprise={enterprise}
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

      {/* Purchase Licenses Modal */}
      {showPurchaseLicensesModal && (
        <PurchaseLicensesModal
          enterpriseId={enterprise.id}
          onClose={() => setShowPurchaseLicensesModal(false)}
          onPurchased={() => {
            setShowPurchaseLicensesModal(false);
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
  const activeSubscription = enterprise.subscriptions.find(s => s.statut === 'ACTIF') || enterprise.subscriptions[0];
  
  // Calcul du quota: utilisateurs + invitations en attente vs licences achetées
  const licencesAchetees = enterprise.licencesAchetees ?? enterprise.nombreUtilisateursInclus;
  const utilisees = enterprise.users.length + pendingInvitations.length;
  const quotaAtteint = utilisees >= licencesAchetees;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Utilisateurs ({enterprise.users.length})</h3>
        <div className="relative group">
          <Button onClick={onInvite} disabled={quotaAtteint}>
            + Inviter un utilisateur
          </Button>
          {quotaAtteint && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              Quota de licences atteint ({utilisees}/{licencesAchetees}). 
              Achetez des licences supplémentaires dans l'onglet "Licences".
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">Utilisateur</th>
              <th className="text-left p-4 font-medium text-gray-700">Rôle</th>
              <th className="text-left p-4 font-medium text-gray-700">Période</th>
              <th className="text-left p-4 font-medium text-gray-700">Dernière connexion</th>
              <th className="text-right p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enterprise.users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
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
                    {activeSubscription ? (
                      <div className="flex flex-col text-xs">
                        <span>Du {new Date(activeSubscription.dateDebut).toLocaleDateString('fr-FR')}</span>
                        <span>Au {new Date(activeSubscription.dateFin).toLocaleDateString('fr-FR')}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
  enterprise,
  onClose,
  onCreated
}: {
  enterprise: EnterpriseAccount;
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
    devise: 'XAF',
    source: 'OFFLINE',
    promoCodeId: '',
    contactName: enterprise.nom || '',
    contactEmail: enterprise.contactEmail || '',
    telephone: enterprise.contactTelephone || '',
    pays: '',
    licencesDemandees: enterprise.nombreUtilisateursInclus || 1,
    bulletin: null as File | null,
    receipt: null as File | null,
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
      const fd = new FormData();
      fd.append("enterpriseAccountId", enterprise.id);
      fd.append("contactName", form.contactName || enterprise.nom || "Contact");
      fd.append("contactEmail", form.contactEmail || enterprise.contactEmail || "");
      if (form.telephone) fd.append("telephone", form.telephone);
      if (form.pays) fd.append("pays", form.pays);
      fd.append("type", form.type);
      fd.append("dateDebut", form.dateDebut);
      fd.append("dateFin", form.dateFin);
      fd.append("montant", montantNumber.toString());
      fd.append("devise", form.devise);
      fd.append("source", form.source);
      fd.append("licencesDemandees", (form.licencesDemandees || enterprise.nombreUtilisateursInclus || 1).toString());
      if (form.promoCodeId) fd.append("promoCodeId", form.promoCodeId);
      if (form.bulletin) fd.append("bulletin", form.bulletin);
      if (form.receipt) fd.append("receipt", form.receipt);

      const res = await fetch('/api/admin/subscriptions/manual/enterprise', {
        method: 'POST',
        body: fd
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la soumission");
      }

      onCreated();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la soumission');
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Licences demandées</label>
            <input
              type="number"
              min={enterprise.nombreUtilisateursInclus || 1}
              value={form.licencesDemandees}
              onChange={(e) => setForm({ ...form, licencesDemandees: parseInt(e.target.value) || enterprise.nombreUtilisateursInclus || 1 })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Au minimum : {enterprise.nombreUtilisateursInclus || 1} (quota actuel)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact (nom)</label>
              <input
                type="text"
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (optionnel)</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="+237..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pays (optionnel)</label>
              <input
                type="text"
                value={form.pays}
                onChange={(e) => setForm({ ...form, pays: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Cameroun"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulletin d'abonnement (optionnel)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setForm({ ...form, bulletin: e.target.files?.[0] || null })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reçu de caisse (optionnel)</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0] || null })}
                className="w-full"
              />
            </div>
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
                Nombre de licences
              </label>
              <input
                type="number"
                readOnly
                value={enterprise.licencesAchetees ?? enterprise.nombreUtilisateursInclus}
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="text-sm text-blue-600 mt-1">
                ℹ️ Gérez les licences dans l'onglet "Licences"
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

// ============================================
// LICENSES TAB
// ============================================
interface LicenseSummary {
  achetees: number;
  utilisees: number;
  disponibles: number;
  invitationsPending: number;
}

interface LicenseTransaction {
  id: string;
  type: 'ACHAT' | 'AJUSTEMENT_ADMIN' | 'REMBOURSEMENT' | 'MIGRATION_INITIALE';
  delta: number;
  reason?: string;
  paymentRef?: string;
  prixUnitaire?: number;
  montantTotal?: number;
  createdAt: string;
  createdBy?: {
    nom: string;
    email: string;
  };
}

function LicensesTab({ 
  enterprise,
  onPurchase,
  onUpdate
}: { 
  enterprise: EnterpriseAccount;
  onPurchase: () => void;
  onUpdate: () => void;
}) {
  const [summary, setSummary] = useState<LicenseSummary | null>(null);
  const [transactions, setTransactions] = useState<LicenseTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  const fetchLicenseData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}/licenses`);
      if (!res.ok) throw new Error('Failed to fetch licenses');
      const data = await res.json();
      setSummary(data.summary);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching license data:', error);
    } finally {
      setLoading(false);
    }
  }, [enterprise.id]);

  useEffect(() => {
    fetchLicenseData();
  }, [fetchLicenseData]);

  const handleAdjust = async () => {
    if (adjustDelta === 0 || !adjustReason.trim()) return;
    
    setAdjusting(true);
    try {
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}/licenses/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta: adjustDelta, reason: adjustReason })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to adjust licenses');
      }
      
      setShowAdjustForm(false);
      setAdjustDelta(0);
      setAdjustReason('');
      fetchLicenseData();
      onUpdate();
    } catch (error) {
      console.error('Error adjusting licenses:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'ajustement');
    } finally {
      setAdjusting(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'ACHAT': return 'Achat';
      case 'AJUSTEMENT_ADMIN': return 'Ajustement';
      case 'REMBOURSEMENT': return 'Remboursement';
      case 'MIGRATION_INITIALE': return 'Migration';
      default: return type;
    }
  };

  const getTransactionTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'ACHAT': return 'bg-green-100 text-green-800';
      case 'AJUSTEMENT_ADMIN': return 'bg-blue-100 text-blue-800';
      case 'REMBOURSEMENT': return 'bg-red-100 text-red-800';
      case 'MIGRATION_INITIALE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Chargement...</div>;
  }

  const usagePercentage = summary ? Math.round((summary.utilisees / Math.max(summary.achetees, 1)) * 100) : 0;
  const effectiveDisponibles = summary ? summary.disponibles - summary.invitationsPending : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Licences achetées</p>
          <p className="text-2xl font-bold text-gray-900">{summary?.achetees || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Utilisées</p>
          <p className="text-2xl font-bold text-blue-600">{summary?.utilisees || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Disponibles</p>
          <p className="text-2xl font-bold text-green-600">{summary?.disponibles || 0}</p>
          {(summary?.invitationsPending || 0) > 0 && (
            <p className="text-xs text-orange-500 mt-1">
              dont {summary?.invitationsPending} réservées (invitations)
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Taux d'utilisation</p>
          <p className="text-2xl font-bold text-gray-900">{usagePercentage}%</p>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Utilisation des licences</span>
          <span className="text-sm text-gray-500">
            {summary?.utilisees || 0} / {summary?.achetees || 0}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all ${
              usagePercentage >= 90 ? 'bg-red-500' : 
              usagePercentage >= 70 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        {effectiveDisponibles <= 0 && (
          <p className="text-sm text-red-600 mt-2">
            ⚠️ Quota atteint - Impossible d'inviter de nouveaux utilisateurs
          </p>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={onPurchase}>
          + Acheter des licences
        </Button>
        <Button variant="secondary" onClick={() => setShowAdjustForm(!showAdjustForm)}>
          Ajustement manuel
        </Button>
      </div>

      {/* Adjust Form */}
      {showAdjustForm && (
        <Card className="p-4 border-l-4 border-blue-500">
          <h4 className="font-medium mb-3">Ajustement manuel des licences</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delta (+ ou -)
              </label>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="+5 ou -2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison *
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ex: Correction suite erreur de saisie"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button 
              onClick={handleAdjust} 
              disabled={adjustDelta === 0 || !adjustReason.trim() || adjusting}
            >
              {adjusting ? 'Ajustement...' : 'Appliquer'}
            </Button>
            <Button variant="secondary" onClick={() => setShowAdjustForm(false)}>
              Annuler
            </Button>
          </div>
        </Card>
      )}

      {/* Transaction History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Historique des transactions</h3>
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Date</th>
                <th className="text-left p-4 font-medium text-gray-700">Type</th>
                <th className="text-left p-4 font-medium text-gray-700">Quantité</th>
                <th className="text-left p-4 font-medium text-gray-700">Raison</th>
                <th className="text-left p-4 font-medium text-gray-700">Référence</th>
                <th className="text-left p-4 font-medium text-gray-700">Montant</th>
                <th className="text-left p-4 font-medium text-gray-700">Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Aucune transaction de licence enregistrée
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(tx.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeBadgeClass(tx.type)}`}>
                        {getTransactionTypeLabel(tx.type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={tx.delta >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {tx.delta >= 0 ? '+' : ''}{tx.delta}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm max-w-xs truncate">
                      {tx.reason || '-'}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {tx.paymentRef || '-'}
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {tx.montantTotal ? `${tx.montantTotal.toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {tx.createdBy?.nom || 'Système'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

// ============================================
// PURCHASE LICENSES MODAL
// ============================================
function PurchaseLicensesModal({
  enterpriseId,
  onClose,
  onPurchased
}: {
  enterpriseId: string;
  onClose: () => void;
  onPurchased: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState(5000);
  const [paymentRef, setPaymentRef] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const montantTotal = quantity * prixUnitaire;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/enterprises/${enterpriseId}/licenses/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          prixUnitaire,
          paymentRef: paymentRef || undefined,
          reason: reason || undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to purchase licenses');
      }

      onPurchased();
    } catch (error) {
      console.error('Error purchasing licenses:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'achat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Acheter des licences</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de licences *
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prix unitaire (FCFA) *
              </label>
              <input
                type="number"
                min={0}
                value={prixUnitaire}
                onChange={(e) => setPrixUnitaire(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Montant total</span>
              <span className="text-xl font-bold text-blue-600">
                {montantTotal.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Référence de paiement
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ex: VIR-2024-001, FACT-123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire / Raison
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Ex: Achat annuel, Extension suite demande client..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || quantity <= 0}>
              {loading ? 'Enregistrement...' : `Acheter ${quantity} licence${quantity > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
