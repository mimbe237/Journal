"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export default function NewSubscriberForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedCountries = useMemo(() => [...COUNTRIES].sort((a, b) => a.localeCompare(b)), []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formEl = e.currentTarget;
    const bulletin = formEl.querySelector<HTMLInputElement>('input[name="bulletin"]')?.files?.[0] || null;
    const receipt = formEl.querySelector<HTMLInputElement>('input[name="receipt"]')?.files?.[0] || null;
    const maxSize = 5 * 1024 * 1024;
    if (bulletin && bulletin.size > maxSize) {
      setError(`Le bulletin dépasse 5 Mo (${(bulletin.size / (1024 * 1024)).toFixed(1)} Mo).`);
      setLoading(false);
      return;
    }
    if (receipt && receipt.size > maxSize) {
      setError(`Le reçu dépasse 5 Mo (${(receipt.size / (1024 * 1024)).toFixed(1)} Mo).`);
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/subscribers/create", {
        method: "POST",
        body: formData
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || res.statusText || "Erreur lors de la création");
      }
      router.push("/admin/subscribers?success=1");
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

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

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Création..." : "Créer l'abonné"}
          </button>
        </div>
      </form>
    </div>
  );
}
