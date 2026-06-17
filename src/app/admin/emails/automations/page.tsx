'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface EmailTemplate {
  id: string;
  slug: string;
  nom: string;
  status: string;
}

interface EmailAutomation {
  id: string;
  triggerType: string;
  templateId: string;
  delayMinutes: number;
  conditions: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  template: EmailTemplate;
}

// Types de triggers disponibles (doit correspondre à l'enum Prisma)
const TRIGGER_TYPES: { value: string; label: string; description: string }[] = [
  { value: 'INSCRIPTION', label: 'Inscription', description: 'Nouvel utilisateur créé' },
  { value: 'ABONNEMENT_ACTIF', label: 'Abonnement activé', description: 'Abonnement validé/activé' },
  { value: 'ABONNEMENT_EXPIRE_BIENTOT', label: 'Expiration proche', description: 'Abonnement expire bientôt' },
  { value: 'ABONNEMENT_EXPIRE', label: 'Abonnement expiré', description: 'Abonnement a expiré' },
  { value: 'PAIEMENT_RECU', label: 'Paiement reçu', description: 'Paiement confirmé' },
  { value: 'PAIEMENT_ECHEC', label: 'Paiement échoué', description: 'Paiement a échoué' },
  { value: 'NOUVELLE_EDITION', label: 'Nouvelle édition', description: 'Nouvelle édition publiée' },
  { value: 'MOT_DE_PASSE_RESET', label: 'Reset mot de passe', description: 'Demande de réinitialisation' },
  { value: 'BIENVENUE', label: 'Bienvenue', description: 'Email de bienvenue' },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formTriggerType, setFormTriggerType] = useState('');
  const [formTemplateId, setFormTemplateId] = useState('');
  const [formDelayMinutes, setFormDelayMinutes] = useState(0);
  const [formActive, setFormEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [autoRes, templatesRes] = await Promise.all([
        fetch('/api/admin/emails/automations'),
        fetch('/api/admin/emails/templates?status=PUBLISHED'),
      ]);

      if (autoRes.ok) {
        setAutomations(await autoRes.json());
      }
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || data);
      }
    } catch (err) {
      console.error('Error fetching automations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get triggers that don't have an automation yet
  const availableTriggers = TRIGGER_TYPES.filter(
    t => !automations.some(a => a.triggerType === t.value)
  );

  const resetForm = () => {
    setFormTriggerType('');
    setFormTemplateId('');
    setFormDelayMinutes(0);
    setFormEnabled(true);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    if (availableTriggers.length > 0) {
      setFormTriggerType(availableTriggers[0].value);
    }
    setEditingId(null);
    setShowCreateModal(true);
  };

  const openEditModal = (automation: EmailAutomation) => {
    setFormTriggerType(automation.triggerType);
    setFormTemplateId(automation.templateId);
    setFormDelayMinutes(automation.delayMinutes);
    setFormEnabled(automation.active);
    setEditingId(automation.id);
    setError(null);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formTemplateId) {
      setError('Veuillez sélectionner un template');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingId 
        ? `/api/admin/emails/automations/${editingId}`
        : '/api/admin/emails/automations';
      
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerType: formTriggerType,
          templateId: formTemplateId,
          delayMinutes: formDelayMinutes,
          active: formActive,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error saving automation:', err);
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (automation: EmailAutomation) => {
    try {
      const res = await fetch(`/api/admin/emails/automations/${automation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !automation.active }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling automation:', err);
    }
  };

  const handleDelete = async (automation: EmailAutomation) => {
    if (!confirm(`Supprimer l'automatisation "${getTriggerLabel(automation.triggerType)}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/emails/automations/${automation.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting automation:', err);
    }
  };

  const getTriggerLabel = (triggerType: string) => {
    return TRIGGER_TYPES.find(t => t.value === triggerType)?.label || triggerType;
  };

  const getTriggerDescription = (triggerType: string) => {
    return TRIGGER_TYPES.find(t => t.value === triggerType)?.description || '';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automatisations Email</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configurez les emails envoyés automatiquement lors d&apos;événements
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/emails"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Retour au dashboard
            </Link>
            {availableTriggers.length > 0 && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Nouvelle automatisation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 Comment ça marche ?</h3>
        <p className="text-sm text-blue-800">
          Les automatisations envoient automatiquement un email lorsqu&apos;un événement se produit
          (inscription, abonnement, paiement, etc.). Associez chaque événement à un template 
          et configurez éventuellement un délai d&apos;envoi.
        </p>
      </div>

      {/* Automations list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune automatisation configurée
          </h3>
          <p className="text-gray-500 mb-4">
            Créez votre première automatisation pour envoyer des emails automatiques
          </p>
          {availableTriggers.length > 0 && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Créer une automatisation
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Événement
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Délai
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {automations.map((automation) => (
                <tr key={automation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {getTriggerLabel(automation.triggerType)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTriggerDescription(automation.triggerType)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/emails/templates/${automation.template.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {automation.template.nom}
                    </Link>
                    <div className="text-xs text-gray-400">{automation.template.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {automation.delayMinutes === 0 ? (
                      <span className="text-gray-500">Immédiat</span>
                    ) : automation.delayMinutes < 60 ? (
                      <span>{automation.delayMinutes} min</span>
                    ) : (
                      <span>{Math.round(automation.delayMinutes / 60)} h</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(automation)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        automation.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {automation.active ? '✓ Actif' : '○ Inactif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(automation)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(automation)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Available triggers not configured */}
      {availableTriggers.length > 0 && automations.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3">
            Événements non configurés ({availableTriggers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableTriggers.map((trigger) => (
              <span
                key={trigger.value}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600"
              >
                {trigger.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Modifier l\'automatisation' : 'Nouvelle automatisation'}
              </h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Événement déclencheur
                </label>
                <select
                  value={formTriggerType}
                  onChange={(e) => setFormTriggerType(e.target.value)}
                  disabled={!!editingId}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  {editingId ? (
                    <option value={formTriggerType}>
                      {getTriggerLabel(formTriggerType)}
                    </option>
                  ) : (
                    availableTriggers.map((trigger) => (
                      <option key={trigger.value} value={trigger.value}>
                        {trigger.label} - {trigger.description}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template à envoyer
                </label>
                <select
                  value={formTemplateId}
                  onChange={(e) => setFormTemplateId(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.nom} ({template.slug})
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Aucun template publié disponible. 
                    <Link href="/admin/emails/templates/new" className="underline ml-1">
                      Créer un template
                    </Link>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Délai d&apos;envoi (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formDelayMinutes}
                  onChange={(e) => setFormDelayMinutes(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = envoi immédiat. Exemple: 1440 = 24 heures
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formActive}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="active" className="text-sm text-gray-700">
                  Automatisation active
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTemplateId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
