"use client";

import { useEffect, useState } from "react";
import { DiscountType, PromoCode } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/FormControls";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";

type Promo = PromoCode;

export default function AdminPromocodesPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    typeRemise: "POURCENTAGE" as DiscountType,
    valeurRemise: 10,
    dateDebut: "",
    dateFin: "",
    nombreUtilisationsMax: "",
    actif: true
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/promocodes", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de chargement");
      setPromos(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promocodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          valeurRemise: Number(form.valeurRemise),
          dateDebut: form.dateDebut || new Date().toISOString(),
          dateFin: form.dateFin || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          nombreUtilisationsMax: form.nombreUtilisationsMax
            ? Number(form.nombreUtilisationsMax)
            : null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Création impossible");
      setForm({
        code: "",
        typeRemise: "POURCENTAGE",
        valeurRemise: 10,
        dateDebut: "",
        dateFin: "",
        nombreUtilisationsMax: "",
        actif: true
      });
      fetchPromos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function togglePromo(id: string, actif: boolean) {
    try {
      const res = await fetch(`/api/admin/promocodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actif })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mise à jour impossible");
      fetchPromos();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <LoadingState message="Chargement des codes promo..." />;
  if (error) return <ErrorState message={error} onRetry={fetchPromos} />;

  return (
    <div className="p-6 mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Codes promotionnels"
        description="Gérez les remises applicables aux abonnements et achats uniques."
      />

      <Card className="p-4 bg-white">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Créer un code promo</h2>
        <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
              placeholder="EX: HIVER25"
            />
          </div>
          <div className="space-y-2">
            <Label>Type de remise</Label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.typeRemise}
              onChange={(e) => setForm({ ...form, typeRemise: e.target.value as DiscountType })}
            >
              <option value="POURCENTAGE">Pourcentage</option>
              <option value="MONTANT_FIXE">Montant fixe</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Valeur</Label>
            <Input
              type="number"
              value={form.valeurRemise}
              onChange={(e) => setForm({ ...form, valeurRemise: Number(e.target.value) })}
              required
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Début</Label>
            <Input
              type="date"
              value={form.dateDebut}
              onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Fin</Label>
            <Input
              type="date"
              value={form.dateFin}
              onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Utilisations max (optionnel)</Label>
            <Input
              type="number"
              value={form.nombreUtilisationsMax}
              onChange={(e) => setForm({ ...form, nombreUtilisationsMax: e.target.value })}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Actif</Label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={form.actif ? "true" : "false"}
              onChange={(e) => setForm({ ...form, actif: e.target.value === "true" })}
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={creating} className="w-full">
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden bg-white">
        {promos.length === 0 ? (
          <EmptyState title="Aucun code promo" message="Créez un premier code pour commencer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Code</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Type</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Valeur</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Période</th>
                  <th className="p-3 text-left text-xs font-semibold uppercase text-slate-500">Actif</th>
                  <th className="p-3 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{promo.code}</td>
                    <td className="p-3 text-sm text-slate-700">{promo.typeRemise}</td>
                    <td className="p-3 text-sm text-slate-700">
                      {promo.typeRemise === "POURCENTAGE"
                        ? `${promo.valeurRemise.toString()}%`
                        : `${promo.valeurRemise.toString()} FCFA`}
                    </td>
                    <td className="p-3 text-sm text-slate-700">
                      {new Date(promo.dateDebut).toLocaleDateString("fr-FR")} →{" "}
                      {new Date(promo.dateFin).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          promo.actif ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {promo.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => togglePromo(promo.id, !promo.actif)}
                        className="text-xs"
                      >
                        {promo.actif ? "Désactiver" : "Activer"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
