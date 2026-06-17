"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, RotateCcw, AlertTriangle, User, Building2, FileText, Newspaper, CreditCard, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

type TrashableEntity = "user" | "enterprise" | "edition" | "journalType" | "subscription";

interface TrashItem {
  id: string;
  type: TrashableEntity;
  name: string;
  deletedAt: string;
  trashedUntil: string;
  deletedBy?: string;
  meta?: Record<string, unknown>;
}

const typeLabels: Record<TrashableEntity, string> = {
  user: "Utilisateur",
  enterprise: "Entreprise",
  edition: "Édition",
  journalType: "Type de journal",
  subscription: "Abonnement",
};

const typeIcons: Record<TrashableEntity, React.ReactNode> = {
  user: <User className="w-4 h-4" />,
  enterprise: <Building2 className="w-4 h-4" />,
  edition: <FileText className="w-4 h-4" />,
  journalType: <Newspaper className="w-4 h-4" />,
  subscription: <CreditCard className="w-4 h-4" />,
};

const typeColors: Record<TrashableEntity, string> = {
  user: "bg-blue-100 text-blue-800",
  enterprise: "bg-purple-100 text-purple-800",
  edition: "bg-green-100 text-green-800",
  journalType: "bg-orange-100 text-orange-800",
  subscription: "bg-pink-100 text-pink-800",
};

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<TrashableEntity | "all">("all");
  const [confirmDelete, setConfirmDelete] = useState<TrashItem | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/trash");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleRestore = async (item: TrashItem) => {
    try {
      setActionLoading(item.id);
      const res = await fetch("/api/admin/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type, id: item.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la restauration");
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (item: TrashItem) => {
    try {
      setActionLoading(item.id);
      const res = await fetch("/api/admin/trash/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: item.type, id: item.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setConfirmDelete(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredItems = filterType === "all" 
    ? items 
    : items.filter((item) => item.type === filterType);

  const getDaysRemaining = (trashedUntil: string) => {
    const until = new Date(trashedUntil);
    const now = new Date();
    const diff = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            Corbeille
          </h1>
          <p className="text-gray-500 mt-1">
            Les éléments supprimés sont conservés 7 jours avant suppression définitive.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {items.length} élément{items.length > 1 ? "s" : ""} dans la corbeille
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            filterType === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tous ({items.length})
        </button>
        {(Object.keys(typeLabels) as TrashableEntity[]).map((type) => {
          const count = items.filter((i) => i.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                filterType === type
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {typeIcons[type]}
              {typeLabels[type]} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {filteredItems.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">La corbeille est vide</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Élément
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supprimé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temps restant
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const daysRemaining = getDaysRemaining(item.trashedUntil);
                return (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {typeof item.meta?.email === "string" && item.meta.email && (
                        <div className="text-sm text-gray-500">{item.meta.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                        {typeIcons[item.type as TrashableEntity]}
                        {typeLabels[item.type as TrashableEntity]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true, locale: fr })}
                      <div className="text-xs text-gray-400">
                        {format(new Date(item.deletedAt), "dd/MM/yyyy HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${
                        daysRemaining <= 1 ? "text-red-600" : daysRemaining <= 3 ? "text-orange-600" : "text-gray-600"
                      }`}>
                        {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleRestore(item)}
                        disabled={actionLoading === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                        Restaurer
                      </button>
                      <button
                        onClick={() => setConfirmDelete(item)}
                        disabled={actionLoading === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Suppression définitive</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer définitivement <strong>{confirmDelete.name}</strong> ?
              Cette action est irréversible.
            </p>
            {confirmDelete.type === "edition" && (
              <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg mb-4">
                ⚠️ Les fichiers PDF et images associés seront également supprimés du stockage.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handlePermanentDelete(confirmDelete)}
                disabled={actionLoading === confirmDelete.id}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === confirmDelete.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
