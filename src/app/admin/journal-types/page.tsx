"use client";

/**
 * Page d'administration des types de journaux.
 * CRUD complet avec grille tarifaire.
 * Accessible uniquement aux SUPER_ADMIN.
 */

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeleteButton } from "@/components/admin/DeleteButton";

interface JournalType {
  id: string;
  name: string;
  frequency: string;
  unitPrice: number;
  isActive: boolean;
  titleTemplate: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    editions: number;
  };
}

const FREQUENCIES = [
  { value: "QUOTIDIEN", label: "Quotidien" },
  { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
  { value: "MENSUEL", label: "Mensuel" },
  { value: "HORS_SERIE", label: "Hors-série" },
  { value: "SPECIAL", label: "Spécial" }
];

const emptyForm = {
  name: "",
  frequency: "QUOTIDIEN",
  unitPrice: 0,
  titleTemplate: "Edition du {{date_long}}",
  isActive: true
};

export default function JournalTypesPage() {
  const [journalTypes, setJournalTypes] = useState<JournalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchJournalTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/journal-types");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setJournalTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournalTypes();
  }, [fetchJournalTypes]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (jt: JournalType) => {
    setEditingId(jt.id);
    setForm({
      name: jt.name,
      frequency: jt.frequency,
      unitPrice: jt.unitPrice,
      titleTemplate: jt.titleTemplate || "",
      isActive: jt.isActive
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
    const url = editingId 
      ? "/api/admin/journal-types/" + editingId
      : "/api/admin/journal-types";
    
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      await fetchJournalTypes();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const res = await fetch("/api/admin/journal-types/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toggleStatus: true })
      });

      if (!res.ok) throw new Error("Erreur lors du changement de statut");
      await fetchJournalTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm('Voulez-vous vraiment supprimer "' + name + '" ?')) return;

    try {
      const res = await fetch("/api/admin/journal-types/" + id, {
        method: "DELETE"
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      await fetchJournalTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " XAF";
  };

  const getFrequencyLabel = (value: string) => {
    return FREQUENCIES.find(f => f.value === value)?.label || value;
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Types de journaux" />
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Types de journaux" />
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nouveau type
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">
            Fermer
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nom</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fréquence</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Prix unitaire</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Éditions</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {journalTypes.map((jt) => (
              <tr key={jt.id} className={!jt.isActive ? "bg-gray-50" : ""}>
                <td className="px-4 py-3 font-medium">{jt.name}</td>
                <td className="px-4 py-3 text-gray-600">{getFrequencyLabel(jt.frequency)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(jt.unitPrice)}</td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {jt._count?.editions || 0}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleStatus(jt.id)}
                    className={"px-2 py-1 rounded text-xs font-medium " + (jt.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}
                  >
                    {jt.isActive ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => openEditModal(jt)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Modifier
                    </button>
                    <DeleteButton
                      type="journalType"
                      id={jt.id}
                      name={jt.name}
                      onDeleted={fetchJournalTypes}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {journalTypes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Aucun type de journal configuré.
                </td>
              </tr>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {journalTypes.map((jt) => (
              <tr key={jt.id} className={!jt.isActive ? "bg-gray-50" : ""}>
                <td className="px-4 py-3 font-medium">{jt.name}</td>
                <td className="px-4 py-3 text-gray-600">{getFrequencyLabel(jt.frequency)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(jt.unitPrice)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(jt.monthlyPrice)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(jt.sixMonthPrice)}</td>
                <td className="px-4 py-3 text-right">{formatPrice(jt.yearlyPrice)}</td>
                <td className="px-4 py-3 text-center text-gray-600">
                  {jt._count?.editions || 0}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleStatus(jt.id)}
                    className={"px-2 py-1 rounded text-xs font-medium " + (jt.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}
                  >
                    {jt.isActive ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => openEditModal(jt)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Modifier
                    </button>
                    <DeleteButton
                      type="journalType"
                      id={jt.id}
                      name={jt.name}
                      onDeleted={fetchJournalTypes}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {journalTypes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  Aucun type de journal configuré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Modifier le type" : "Nouveau type de journal"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du journal *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fréquence *
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix unitaire (XAF) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.unitPrice}
                    onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>                    min="0"
                    value={form.yearlyPrice}
                    onChange={(e) => setForm({ ...form, yearlyPrice: Number(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle de titre *
                </label>
                <input
                  type="text"
                  value={form.titleTemplate}
                  onChange={(e) => setForm({ ...form, titleTemplate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="{{journal}} - Édition du {{date_long}}"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tokens : {'{{journal}}'}, {'{{date}}'}, {'{{date_long}}'}, {'{{frequency}}'}
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Type actif (visible pour création d&apos;éditions)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
