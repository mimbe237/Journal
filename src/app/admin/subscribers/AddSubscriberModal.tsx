"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { COUNTRIES } from "@/lib/countries";

type EnterpriseOption = { id: string; nom: string };

export function AddSubscriberModal({ enterprises }: { enterprises: EnterpriseOption[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [useNewEnterprise, setUseNewEnterprise] = useState(false);

  const sortedCountries = useMemo(() => [...COUNTRIES].sort((a, b) => a.localeCompare(b)), []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    if (useNewEnterprise) {
      formData.delete("enterpriseId");
    } else {
      formData.delete("enterpriseName");
    }

    try {
      const res = await fetch("/api/admin/subscribers/create", {
        method: "POST",
        body: formData
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Erreur lors de la création");
      }
      setSuccess("Abonné créé avec succès");
      e.currentTarget.reset();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nouvel abonné</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Ajouter un abonné</h2>
                <p className="text-sm text-slate-500">Capture complète (infos personnelles, pro, abonnement, documents)</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
              {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

              {/* Informations personnelles */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">Informations personnelles</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Nom(s) complet</label>
                    <input
                      name="nom"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Téléphone</label>
                    <input
                      name="telephone"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Pays</label>
                    <select
                      name="pays"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Sélectionner un pays</option>
                      {sortedCountries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Informations professionnelles */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">Informations professionnelles</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Entreprise (optionnel)</label>
                    <select
                      name="enterpriseId"
                      disabled={useNewEnterprise}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    >
                      <option value="">Aucune (individuel)</option>
                      {enterprises.map((ent) => (
                        <option key={ent.id} value={ent.id}>
                          {ent.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={useNewEnterprise}
                        onChange={(e) => setUseNewEnterprise(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Ajouter une nouvelle entreprise
                    </label>
                  </div>
                  {useNewEnterprise && (
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Nom de la nouvelle entreprise</label>
                      <input
                        name="enterpriseName"
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Informations d'abonnement */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">Informations d’abonnement</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Date de début</label>
                    <input
                      type="date"
                      name="dateDebut"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Date d’expiration</label>
                    <input
                      type="date"
                      name="dateFin"
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800">Documents à joindre</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Bulletin d’abonnement</label>
                    <input
                      type="file"
                      name="bulletin"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Reçu de caisse</label>
                    <input
                      type="file"
                      name="receipt"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="secondary" type="button" onClick={() => setOpen(false)} disabled={loading}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Enregistrement..." : "Enregistrer l’abonné"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
