'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';

interface EnterpriseAccount {
  id: string;
  nom: string;
  contactEmail: string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendInvitation, setSendInvitation] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/enterprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sendAdminInvitation: sendInvitation
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }

      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Nouvelle Entreprise</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="ACME Corporation"
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contact@entreprise.com"
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+237 6XX XXX XXX"
              />
            </div>
          </div>

          {/* Admin Primaire Section */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <h3 className="text-sm font-semibold text-purple-800 mb-3">
              👤 Administrateur Primaire
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de l'admin primaire *
              </label>
              <input
                type="email"
                required
                value={formData.adminPrimaireEmail}
                onChange={(e) => setFormData({ ...formData, adminPrimaireEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="admin@entreprise.com"
              />
              <p className="text-xs text-purple-600 mt-1">
                Cette personne recevra une invitation et pourra gérer les utilisateurs de l'entreprise.
              </p>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvitation}
                  onChange={(e) => setSendInvitation(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Envoyer l'invitation par email maintenant
                </span>
              </label>
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
                min="1"
                value={formData.nombreUtilisateursInclus}
                onChange={(e) => setFormData({ ...formData, nombreUtilisateursInclus: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Niveau SLA
              </label>
              <select
                value={formData.niveauSla}
                onChange={(e) => setFormData({ ...formData, niveauSla: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro SIRET / Registre de commerce
            </label>
            <input
              type="text"
              value={formData.numeroSiret}
              onChange={(e) => setFormData({ ...formData, numeroSiret: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 456 789 00012"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse de facturation
            </label>
            <textarea
              value={formData.adresseFacturation}
              onChange={(e) => setFormData({ ...formData, adresseFacturation: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="123 Rue Example, 75000 Paris"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'entreprise'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal d'ajout en masse d'utilisateurs entreprise
function BulkUsersModal({
  enterprise,
  onClose,
  onCreated
}: {
  enterprise: EnterpriseAccount;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [rows, setRows] = useState(
    Array.from({ length: 5 }, () => ({ nom: "", email: "", fonction: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const licencesDisponibles =
    enterprise.nombreUtilisateursInclus - (enterprise._count?.users || 0);

  const handleChange = (idx: number, field: string, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => setRows((prev) => [...prev, { nom: "", email: "", fonction: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const valid = rows.filter((r) => r.nom && r.email);
      if (valid.length === 0) throw new Error("Aucun utilisateur valide");
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}/users/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: valid })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ajout impossible");
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ajout en masse</h2>
            <p className="text-sm text-slate-500">
              Licences disponibles : {Math.max(licencesDisponibles, 0)}
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="overflow-auto rounded border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Nom & prénom</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Fonction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2">
                      <Input
                        value={row.nom}
                        onChange={(e) => handleChange(idx, "nom", e.target.value)}
                        placeholder="Nom complet"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="email"
                        value={row.email}
                        onChange={(e) => handleChange(idx, "email", e.target.value)}
                        placeholder="email@example.com"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.fonction}
                        onChange={(e) => handleChange(idx, "fonction", e.target.value)}
                        placeholder="Fonction (optionnel)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addRow}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              + Ajouter une ligne
            </button>
            <Button type="submit" disabled={loading || licencesDisponibles <= 0}>
              {loading ? "Ajout..." : "Créer ces utilisateurs"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal pour ajuster les licences
function LicencesModal({
  enterprise,
  onClose,
  onUpdated
}: {
  enterprise: EnterpriseAccount;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [licences, setLicences] = useState(enterprise.nombreUtilisateursInclus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreUtilisateursInclus: licences })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mise à jour impossible");
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-slate-900">Licences</h2>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-1">
            <Label>Licences achetées</Label>
            <Input
              type="number"
              min={0}
              value={licences}
              onChange={(e) => setLicences(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">
              Utilisées : {enterprise._count?.users || 0} / {enterprise.nombreUtilisateursInclus}
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? "Enregistrement..." : "Mettre à jour"}
          </Button>
        </form>
      </div>
    </div>
  );
}
