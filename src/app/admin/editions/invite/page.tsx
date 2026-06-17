"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GuestSlot {
  id: string;
  dayOfWeek: number;
  dayLabel: string;
  editionId: string | null;
  edition: {
    id: string;
    titre: string;
    datePublication: string;
    type: string;
    nombrePages: number | null;
    cheminImageUne: string | null;
    deletedAt: string | null;
  } | null;
  publicToken: string;
  publicUrl: string | null;
  assignedAt: string | null;
  isActive: boolean;
}

interface EditionOption {
  id: string;
  titre: string;
  datePublication: string;
  type: string;
  cheminImageUne: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-violet-100 text-violet-700",
  3: "bg-emerald-100 text-emerald-700",
  4: "bg-orange-100 text-orange-700",
  5: "bg-red-100 text-red-700",
  6: "bg-pink-100 text-pink-700",
  7: "bg-indigo-100 text-indigo-700",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAssignedAt(dateStr: string | null): string {
  if (!dateStr) return "—";
  return format(new Date(dateStr), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
}

function formatPublicationDate(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function GuestEditionsPage() {
  const [slots, setSlots] = useState<GuestSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [editingSlot, setEditingSlot] = useState<GuestSlot | null>(null);
  const [editions, setEditions] = useState<EditionOption[]>([]);
  const [editionsLoading, setEditionsLoading] = useState(false);
  const [editionsLoaded, setEditionsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Fetch slots ──
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guest-editions");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setSlots(data);
    } catch (e: any) {
      setError(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // ── Fetch editions for modal (once) ──
  const fetchEditions = useCallback(async () => {
    if (editionsLoaded) return;
    setEditionsLoading(true);
    try {
      const res = await fetch("/api/admin/editions?limit=200&order=DESC");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setEditions(data.editions ?? []);
      setEditionsLoaded(true);
    } catch {
      // Silencieux — l'utilisateur verra la liste vide
    } finally {
      setEditionsLoading(false);
    }
  }, [editionsLoaded]);

  // ── Open modal ──
  const openModal = (slot: GuestSlot) => {
    setEditingSlot(slot);
    setSearchQuery("");
    fetchEditions();
  };

  // ── Close modal (Escape key) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditingSlot(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Select edition ──
  const selectEdition = async (editionId: string) => {
    if (!editingSlot || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/guest-editions/${editingSlot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert("Erreur : " + (data.error ?? "Erreur lors de la sauvegarde"));
        return;
      }
      setEditingSlot(null);
      await fetchSlots();
    } catch {
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // ── Clear slot ──
  const clearSlot = async (slot: GuestSlot) => {
    if (!window.confirm(`Effacer l'édition du ${slot.dayLabel} ?`)) return;
    try {
      const res = await fetch(`/api/admin/guest-editions/${slot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editionId: null }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert("Erreur : " + (data.error ?? "Impossible d'effacer"));
        return;
      }
      await fetchSlots();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  // ── Copy link ──
  const copyLink = async (slot: GuestSlot) => {
    if (!slot.publicUrl) return;
    await navigator.clipboard.writeText(slot.publicUrl);
    setCopiedId(slot.id);
    setTimeout(() => setCopiedId((prev) => (prev === slot.id ? null : prev)), 2000);
  };

  // ── Filtered editions in modal ──
  const filteredEditions = editions.filter((e) =>
    e.titre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchSlots}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Éditions invitées</h1>
            <p className="mt-1 text-sm text-slate-500">
              Configurez une édition gratuite pour chaque jour de la semaine. Les liens générés sont accessibles sans connexion.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
            7 créneaux
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Jour</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mise à jour</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Édition assignée</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lien public</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slots.map((slot) => (
                <tr key={slot.id} className={!slot.isActive ? "opacity-50" : ""}>

                  {/* Jour */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${DAY_COLORS[slot.dayOfWeek] ?? "bg-slate-100 text-slate-600"}`}>
                      {slot.dayLabel}
                    </span>
                    {!slot.isActive && (
                      <span className="ml-2 text-xs text-slate-400 italic">Désactivé</span>
                    )}
                  </td>

                  {/* Date MAJ */}
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {formatAssignedAt(slot.assignedAt)}
                  </td>

                  {/* Édition */}
                  <td className="px-4 py-4">
                    {slot.edition ? (
                      <div>
                        <p className="text-sm font-medium text-slate-800 leading-tight">
                          {slot.edition.titre}
                          {slot.edition.deletedAt && (
                            <span className="ml-2 text-xs text-red-500">(supprimée)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatPublicationDate(slot.edition.datePublication)}
                        </p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Non configuré
                      </span>
                    )}
                  </td>

                  {/* Lien public */}
                  <td className="px-4 py-4">
                    {slot.publicUrl ? (
                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          readOnly
                          value={slot.publicUrl}
                          className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-600 truncate"
                        />
                        <button
                          onClick={() => copyLink(slot)}
                          title="Copier le lien"
                          className="shrink-0 p-1.5 rounded hover:bg-slate-100 text-slate-500 transition"
                        >
                          {copiedId === slot.id ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        <a
                          href={slot.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Aperçu"
                          className="shrink-0 p-1.5 rounded hover:bg-slate-100 text-slate-500 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(slot)}
                        className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => clearSlot(slot)}
                        disabled={!slot.editionId}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Effacer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de sélection d'édition */}
      {editingSlot && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingSlot(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                Sélectionner une édition — {editingSlot.dayLabel}
              </h2>
              <button
                onClick={() => setEditingSlot(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-slate-100">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une édition..."
                autoFocus
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Edition list */}
            <div className="overflow-y-auto flex-1">
              {editionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredEditions.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Aucune édition trouvée
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredEditions.map((edition) => {
                    const isCurrent = editingSlot.editionId === edition.id;
                    return (
                      <li key={edition.id}>
                        <button
                          onClick={() => selectEdition(edition.id)}
                          disabled={saving}
                          className={`w-full flex items-center justify-between px-6 py-3 text-left hover:bg-slate-50 transition disabled:opacity-50 ${
                            isCurrent ? "ring-2 ring-inset ring-emerald-400 bg-emerald-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isCurrent && (
                              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className="text-sm font-medium text-slate-800">{edition.titre}</span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 ml-4">
                            {formatPublicationDate(edition.datePublication)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
