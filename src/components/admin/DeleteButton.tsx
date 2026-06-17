"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

type TrashableEntity = "user" | "enterprise" | "edition" | "journalType" | "subscription";

interface DeleteButtonProps {
  type: TrashableEntity;
  id: string;
  name: string;
  onDeleted?: () => void;
  className?: string;
  size?: "sm" | "md";
}

const typeLabels: Record<TrashableEntity, string> = {
  user: "l'utilisateur",
  enterprise: "l'entreprise",
  edition: "l'édition",
  journalType: "le type de journal",
  subscription: "l'abonnement",
};

export function DeleteButton({ type, id, name, onDeleted, className = "", size = "sm" }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/trash/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setShowConfirm(false);
      onDeleted?.();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const buttonClasses = size === "sm" 
    ? "p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
    : "px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-1";

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className={`${buttonClasses} ${className}`}
        title="Supprimer"
      >
        <Trash2 className={size === "sm" ? "w-4 h-4" : "w-4 h-4"} />
        {size === "md" && <span>Supprimer</span>}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-4">
              Voulez-vous mettre {typeLabels[type]} <strong>&quot;{name}&quot;</strong> dans la corbeille ?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
              L&apos;élément sera conservé 7 jours dans la corbeille avant suppression définitive.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
