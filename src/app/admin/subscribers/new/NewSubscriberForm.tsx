"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

export default function NewSubscriberForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journalTypes, setJournalTypes] = useState<Array<{
    id: string;
    name: string;
    monthlyPrice: number;
    sixMonthPrice: number;
    yearlyPrice: number;
  }>>([]);
  const [selectedJournalTypeId, setSelectedJournalTypeId] = useState<string>("");
  const [plan, setPlan] = useState<"MONTHLY" | "SIX_MONTHS" | "YEARLY">("MONTHLY");
  const [montant, setMontant] = useState<string>("0");
  const [devise, setDevise] = useState<string>("XAF");
  const [dateDebut, setDateDebut] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dateFin, setDateFin] = useState<string>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");

  const sortedCountries = useMemo(() => [...COUNTRIES].sort((a, b) => a.localeCompare(b)), []);

  // Charger les types de journaux (tarifs)
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/journal-types");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const active = data.filter((d: any) => d.isActive !== false);
          setJournalTypes(active);
          if (active[0]) {
            setSelectedJournalTypeId(active[0].id);
            setDevise("XAF");
            setMontant(active[0].monthlyPrice?.toString() || "0");
          }
          const start = new Date(dateDebut);
          const end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          setDateFin(end.toISOString().split("T")[0]);
        }
      } catch (err) {
        console.error("Impossible de charger les types de journaux", err);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recomputePricing = (jtId: string, nextPlan: "MONTHLY" | "SIX_MONTHS" | "YEARLY") => {
    const jt = journalTypes.find((j) => j.id === jtId);
    if (!jt) return;
    if (nextPlan === "MONTHLY") setMontant(jt.monthlyPrice?.toString() || "0");
    if (nextPlan === "SIX_MONTHS") setMontant(jt.sixMonthPrice?.toString() || "0");
    if (nextPlan === "YEARLY") setMontant(jt.yearlyPrice?.toString() || "0");
    // Date fin auto
    const start = new Date(dateDebut);
    const end = new Date(start);
    end.setMonth(
      end.getMonth() + (nextPlan === "MONTHLY" ? 1 : nextPlan === "SIX_MONTHS" ? 6 : 12)
    );
    setDateFin(end.toISOString().split("T")[0]);
  };

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
              <input
                name="pays"
                list="countries"
                required
                placeholder="Rechercher un pays..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="countries">
                {sortedCountries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Abonnement</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Journal</label>
              <select
                name="journalTypeId"
                value={selectedJournalTypeId}
                onChange={(e) => {
                  const next = e.target.value;
                  setSelectedJournalTypeId(next);
                  recomputePricing(next, plan);
                }}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {journalTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>
                    {jt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mode de paiement</label>
              <select
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CASH">Cash</option>
                <option value="MOBILE">Mobile</option>
                <option value="VISA">Visa/CB</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(["MONTHLY", "SIX_MONTHS", "YEARLY"] as const).map((p) => {
              const label = p === "MONTHLY" ? "Mensuel" : p === "SIX_MONTHS" ? "6 mois" : "1 an";
              const jt = journalTypes.find((j) => j.id === selectedJournalTypeId);
              const price =
                p === "MONTHLY"
                  ? jt?.monthlyPrice
                  : p === "SIX_MONTHS"
                  ? jt?.sixMonthPrice
                  : jt?.yearlyPrice;
              return (
                <label
                  key={p}
                  className={`rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                    plan === p ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p}
                    checked={plan === p}
                    onChange={() => {
                      setPlan(p);
                      recomputePricing(selectedJournalTypeId, p);
                    }}
                    className="mr-2"
                  />
                  {label} {price ? `– ${price} ${devise}` : ""}
                </label>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date de début</label>
              <input
                type="date"
                name="dateDebut"
                value={dateDebut}
                onChange={(e) => {
                  setDateDebut(e.target.value);
                  // recalcul date fin
                  const start = new Date(e.target.value);
                  const end = new Date(start);
                  end.setMonth(end.getMonth() + (plan === "MONTHLY" ? 1 : plan === "SIX_MONTHS" ? 6 : 12));
                  setDateFin(end.toISOString().split("T")[0]);
                }}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date d’expiration</label>
              <input
                type="date"
                name="dateFin"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Montant</label>
              <input
                type="number"
                name="montant"
                min="0"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Devise</label>
              <input
                type="text"
                name="devise"
                value={devise}
                onChange={(e) => setDevise(e.target.value.toUpperCase().slice(0, 3))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">Montant et période sont préremplis selon la formule, mais modifiables si besoin.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Documents à joindre (optionnel)</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bulletin d’abonnement</label>
              <input
                type="file"
                name="bulletin"
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Reçu de caisse</label>
              <input
                type="file"
                name="receipt"
                accept=".pdf,.jpg,.jpeg,.png"
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
