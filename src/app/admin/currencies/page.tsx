"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";

type Currency = {
  code: string;
  name: string;
  rateToXaf: number;
  isActive: boolean;
};

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", rateToXaf: 1 });

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/currencies");
      if (!res.ok) throw new Error("Erreur chargement devises");
      const data = await res.json();
      setCurrencies(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCode
        ? `/api/admin/currencies/${editingCode}`
        : "/api/admin/currencies";
      const method = editingCode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) throw new Error("Erreur sauvegarde");
      await fetchCurrencies();
      setShowModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleStatus = async (code: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/currencies/${code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      await fetchCurrencies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openCreate = () => {
    setEditingCode(null);
    setForm({ code: "", name: "", rateToXaf: 1 });
    setShowModal(true);
  };

  const openEdit = (c: Currency) => {
    setEditingCode(c.code);
    setForm({ code: c.code, name: c.name, rateToXaf: c.rateToXaf });
    setShowModal(true);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Gestion des devises"
        subtitle="Configurez les devises acceptées et leurs taux de conversion par rapport au XAF."
        actions={<ButtonPrimary onClick={openCreate}>+ Nouvelle devise</ButtonPrimary>}
      />

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">Fermer</button>
        </div>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium text-right">Taux (1 Devise = X XAF)</th>
              <th className="px-4 py-3 font-medium text-center">Statut</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currencies.map((c) => (
              <tr key={c.code} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">{c.code}</td>
                <td className="px-4 py-3 text-slate-700">{c.name}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">
                  {new Intl.NumberFormat("fr-FR").format(c.rateToXaf)} XAF
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-slate-600 hover:text-emerald-600 font-medium"
                  >
                    Modifier
                  </button>
                  {c.code !== "XAF" && (
                    <button
                      onClick={() => toggleStatus(c.code, c.isActive)}
                      className={`font-medium ${c.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}`}
                    >
                      {c.isActive ? "Désactiver" : "Activer"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {currencies.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Aucune devise configurée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingCode ? "Modifier la devise" : "Ajouter une devise"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Code ISO (ex: EUR)</label>
                <input
                  type="text"
                  maxLength={3}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={!!editingCode}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nom (ex: Euro)</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Taux de conversion (1 Devise = ? XAF)</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={form.rateToXaf}
                  onChange={(e) => setForm({ ...form, rateToXaf: parseFloat(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Exemple: Pour 1 EUR = 655.957 XAF, entrez 655.957
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <ButtonSecondary type="button" onClick={() => setShowModal(false)}>
                  Annuler
                </ButtonSecondary>
                <ButtonPrimary type="submit">Enregistrer</ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
