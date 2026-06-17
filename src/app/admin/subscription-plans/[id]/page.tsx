"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/FormControls";
import { LoadingState } from "@/components/ui/States";

type JournalType = {
  id: string;
  name: string;
  isActive: boolean;
};

type TargetAudience = "INDIVIDUAL" | "ENTERPRISE";

type SubscriptionPlan = {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  targetAudience: TargetAudience;
  durationMonths: number;
  basePrice: number;
  pricePerUser: number | null;
  minUsers: number | null;
  maxUsers: number | null;
  currency: string;
  advantages: string[];
  highlight: boolean;
  badge: string | null;
  displayOrder: number;
  isActive: boolean;
  isPublic: boolean;
  journalTypes: { journalType: JournalType }[];
};

export default function EditSubscriptionPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [journalTypes, setJournalTypes] = useState<JournalType[]>([]);

  // Form state
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("INDIVIDUAL");
  const [durationMonths, setDurationMonths] = useState(1);
  const [basePrice, setBasePrice] = useState("");
  const [pricePerUser, setPricePerUser] = useState("");
  const [minUsers, setMinUsers] = useState("");
  const [maxUsers, setMaxUsers] = useState("");
  const [currency, setCurrency] = useState("XAF");
  const [selectedJournalTypes, setSelectedJournalTypes] = useState<string[]>([]);
  const [advantages, setAdvantages] = useState<string[]>([""]);
  const [highlight, setHighlight] = useState(false);
  const [badge, setBadge] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [planRes, jtRes] = await Promise.all([
        fetch(`/api/admin/subscription-plans/${id}`),
        fetch("/api/admin/journal-types")
      ]);

      if (!planRes.ok) throw new Error("Plan introuvable");

      const plan: SubscriptionPlan = await planRes.json();
      const jts = await jtRes.json();

      setJournalTypes(jts);
      setNom(plan.nom);
      setDescription(plan.description || "");
      setTargetAudience(plan.targetAudience || "INDIVIDUAL");
      setDurationMonths(plan.durationMonths);
      setBasePrice(plan.basePrice.toString());
      setPricePerUser(plan.pricePerUser?.toString() || "");
      setMinUsers(plan.minUsers?.toString() || "");
      setMaxUsers(plan.maxUsers?.toString() || "");
      setCurrency(plan.currency);
      setSelectedJournalTypes(plan.journalTypes.map((jt) => jt.journalType.id));
      setAdvantages(plan.advantages.length > 0 ? plan.advantages : [""]);
      setHighlight(plan.highlight);
      setBadge(plan.badge || "");
      setDisplayOrder(plan.displayOrder);
      setIsActive(plan.isActive);
      setIsPublic(plan.isPublic);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleJournalType(jtId: string) {
    setSelectedJournalTypes((prev) =>
      prev.includes(jtId) ? prev.filter((x) => x !== jtId) : [...prev, jtId]
    );
  }

  function addAdvantage() {
    setAdvantages([...advantages, ""]);
  }

  function updateAdvantage(index: number, value: string) {
    const updated = [...advantages];
    updated[index] = value;
    setAdvantages(updated);
  }

  function removeAdvantage(index: number) {
    setAdvantages(advantages.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/subscription-plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          description: description || null,
          targetAudience,
          durationMonths,
          basePrice: parseFloat(basePrice),
          currency,
          // Champs entreprise
          pricePerUser: targetAudience === "ENTERPRISE" && pricePerUser ? parseFloat(pricePerUser) : null,
          minUsers: targetAudience === "ENTERPRISE" && minUsers ? parseInt(minUsers) : null,
          maxUsers: targetAudience === "ENTERPRISE" && maxUsers ? parseInt(maxUsers) : null,
          journalTypeIds: selectedJournalTypes,
          advantages: advantages.filter((a) => a.trim() !== ""),
          highlight,
          badge: badge || null,
          displayOrder,
          isActive,
          isPublic
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur mise à jour");
      }

      router.push("/admin/subscription-plans?success=updated");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Êtes-vous sûr de vouloir désactiver ce plan ?")) return;

    try {
      await fetch(`/api/admin/subscription-plans/${id}`, { method: "DELETE" });
      router.push("/admin/subscription-plans?success=deleted");
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <LoadingState message="Chargement du plan..." />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Modifier le plan"
            subtitle={nom}
          />
          <Link href="/admin/subscription-plans">
            <ButtonSecondary>← Retour</ButtonSecondary>
          </Link>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Informations de base */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Informations générales</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="nom">Nom du plan *</Label>
                  <Input
                    id="nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="displayOrder">Ordre d'affichage</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Type d'audience */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Type de plan</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <label
                  className={`flex flex-col gap-2 rounded-lg border p-4 cursor-pointer transition ${
                    targetAudience === "INDIVIDUAL"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="targetAudience"
                      value="INDIVIDUAL"
                      checked={targetAudience === "INDIVIDUAL"}
                      onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                      className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Particulier (B2C)</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-7">
                    Abonnement individuel avec un prix fixe.
                  </p>
                </label>
                
                <label
                  className={`flex flex-col gap-2 rounded-lg border p-4 cursor-pointer transition ${
                    targetAudience === "ENTERPRISE"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="targetAudience"
                      value="ENTERPRISE"
                      checked={targetAudience === "ENTERPRISE"}
                      onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                      className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Entreprise (B2B)</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-7">
                    Tarification par utilisateur avec limites configurables.
                  </p>
                </label>
              </div>
            </div>

            {/* Tarification */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Tarification</h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="durationMonths">Durée (mois) *</Label>
                  <Select
                    id="durationMonths"
                    value={durationMonths.toString()}
                    onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                  >
                    <option value="1">1 mois</option>
                    <option value="3">3 mois</option>
                    <option value="6">6 mois</option>
                    <option value="12">12 mois (1 an)</option>
                    <option value="24">24 mois (2 ans)</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="basePrice">
                    {targetAudience === "ENTERPRISE" ? "Prix de base *" : "Prix *"}
                  </Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    min={0}
                    required
                  />
                  {targetAudience === "ENTERPRISE" && (
                    <p className="mt-1 text-xs text-slate-500">Frais fixes du plan</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="XAF">XAF (FCFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </Select>
                </div>
              </div>

              {/* Champs spécifiques entreprise */}
              {targetAudience === "ENTERPRISE" && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Tarification par utilisateur</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="pricePerUser">Prix par utilisateur *</Label>
                      <Input
                        id="pricePerUser"
                        type="number"
                        value={pricePerUser}
                        onChange={(e) => setPricePerUser(e.target.value)}
                        placeholder="10000"
                        min={0}
                        required={targetAudience === "ENTERPRISE"}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Total = Prix de base + (Prix/utilisateur × Nb utilisateurs)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="minUsers">Utilisateurs min *</Label>
                      <Input
                        id="minUsers"
                        type="number"
                        value={minUsers}
                        onChange={(e) => setMinUsers(e.target.value)}
                        placeholder="5"
                        min={1}
                        required={targetAudience === "ENTERPRISE"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxUsers">Utilisateurs max</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(e.target.value)}
                        placeholder="100 (optionnel)"
                        min={1}
                      />
                      <p className="mt-1 text-xs text-slate-500">Laisser vide = illimité</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Types de journaux */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Journaux inclus
                <span className="text-xs font-normal text-slate-500 ml-2">
                  ({selectedJournalTypes.length} sélectionné{selectedJournalTypes.length > 1 ? "s" : ""})
                </span>
              </h3>
              
              <div className="grid gap-2 md:grid-cols-2">
                {journalTypes.map((jt) => (
                  <label
                    key={jt.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition ${
                      selectedJournalTypes.includes(jt.id)
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedJournalTypes.includes(jt.id)}
                      onChange={() => toggleJournalType(jt.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{jt.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Avantages */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Avantages</h3>
                <button
                  type="button"
                  onClick={addAdvantage}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  + Ajouter
                </button>
              </div>
              
              <div className="space-y-2">
                {advantages.map((adv, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={adv}
                      onChange={(e) => updateAdvantage(i, e.target.value)}
                      placeholder={`Avantage ${i + 1}`}
                      className="flex-1"
                    />
                    {advantages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAdvantage(i)}
                        className="px-3 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Options</h3>
              
              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Actif</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Public</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={highlight}
                    onChange={(e) => setHighlight(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Highlight</span>
                </label>
              </div>

              {highlight && (
                <div>
                  <Label htmlFor="badge">Badge</Label>
                  <Input
                    id="badge"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Populaire"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between border-t pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Désactiver ce plan
              </button>
              <div className="flex gap-3">
                <Link href="/admin/subscription-plans">
                  <ButtonSecondary type="button">Annuler</ButtonSecondary>
                </Link>
                <ButtonPrimary type="submit" disabled={saving || selectedJournalTypes.length === 0}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </ButtonPrimary>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
