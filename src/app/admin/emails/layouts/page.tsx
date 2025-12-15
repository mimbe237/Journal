'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface EmailLayout {
  id: string;
  nom: string;
  mjml: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    templates: number;
  };
}

export default function EmailLayoutsPage() {
  const [layouts, setLayouts] = useState<EmailLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formMjml, setFormMjml] = useState(`<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>
          {{content}}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLayouts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/emails/layouts');
      if (res.ok) {
        setLayouts(await res.json());
      }
    } catch (err) {
      console.error('Error fetching layouts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  const handleCreate = async () => {
    if (!formNom.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!formMjml.includes('{{content}}')) {
      setError('Le layout doit contenir {{content}} pour insérer le corps du template');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/emails/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: formNom.trim(), mjml: formMjml }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormNom('');
        fetchLayouts();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (err) {
      console.error('Error creating layout:', err);
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Layouts Email</h1>
            <p className="text-sm text-gray-500 mt-1">
              Structurez vos emails avec des layouts MJML réutilisables
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/emails/templates"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Retour aux templates
            </Link>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Nouveau layout
            </button>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">💡 À propos des layouts</h3>
        <p className="text-sm text-blue-800">
          Les layouts sont des structures MJML qui définissent l&apos;apparence globale de vos emails 
          (en-tête, pied de page, couleurs). Incluez <code className="bg-blue-100 px-1 rounded">{"{{content}}"}</code> où 
          le corps du template sera inséré.
        </p>
      </div>

      {/* Layouts list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : layouts.length === 0 && !showCreateForm ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">📐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun layout configuré
          </h3>
          <p className="text-gray-500 mb-4">
            Créez votre premier layout pour structurer vos emails
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Créer un layout
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {layouts.map((layout) => (
            <div key={layout.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{layout.nom}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Créé le {new Date(layout.createdAt).toLocaleDateString('fr-FR')}
                    {layout._count && ` • ${layout._count.templates} template(s)`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormNom(layout.nom);
                      setFormMjml(layout.mjml);
                      setShowCreateForm(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Voir / Modifier
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-32">
                  {layout.mjml.substring(0, 500)}
                  {layout.mjml.length > 500 && '...'}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {formNom ? `Layout: ${formNom}` : 'Nouveau layout'}
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
                  Nom du layout *
                </label>
                <input
                  type="text"
                  value={formNom}
                  onChange={(e) => setFormNom(e.target.value)}
                  placeholder="ex: Layout principal"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code MJML *
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Incluez <code className="bg-gray-100 px-1">{"{{content}}"}</code> à l&apos;endroit 
                  où le corps du template sera inséré.
                </p>
                <textarea
                  value={formMjml}
                  onChange={(e) => setFormMjml(e.target.value)}
                  rows={15}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormNom('');
                  setError(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
