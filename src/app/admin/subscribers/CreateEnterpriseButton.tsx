"use client";

import { useState } from "react";
import { ButtonPrimary } from "@/components/ui/Button";
import { createEnterpriseAccount } from "./actions";

export function CreateEnterpriseButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      await createEnterpriseAccount(formData);
      setIsOpen(false);
      alert("Compte entreprise créé.");
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ButtonPrimary onClick={() => setIsOpen(true)} variant="secondary">
        + Compte entreprise
      </ButtonPrimary>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Créer un compte entreprise</h3>
                <p className="text-sm text-slate-500">Paramètres minimaux pour démarrer</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'entreprise</label>
                  <input
                    name="nom"
                    type="text"
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email de contact</label>
                  <input
                    name="contactEmail"
                    type="email"
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone (optionnel)</label>
                  <input
                    name="contactTelephone"
                    type="text"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Licences incluses</label>
                  <input
                    name="nombreUtilisateursInclus"
                    type="number"
                    min="1"
                    defaultValue={10}
                    required
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <p className="text-xs text-slate-500">
                    Vous pourrez ajuster SLA, SSO, IP, etc. dans la fiche entreprise.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded"
                >
                  Annuler
                </button>
                <ButtonPrimary type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer l'entreprise"}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
