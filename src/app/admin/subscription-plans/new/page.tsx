"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/FormControls";

type JournalType = {
  id: string;
  name: string;
  isActive: boolean;
  frequency: string;
  unitPrice: number;
  monthlyPrice: number;
  sixMonthPrice: number;
  yearlyPrice: number;
};

type TargetAudience = "INDIVIDUAL" | "ENTERPRISE";

export default function NewSubscriptionPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
  const [isPublic, setIsPublic] = useState(true);
  const [basePriceManuallyEdited, setBasePriceManuallyEdited] = useState(false);
  const [pricePerUserManuallyEdited, setPricePerUserManuallyEdited] = useState(false);
  const [suggestedBasePrice, setSuggestedBasePrice] = useState<number | null>(null);
  const [suggestedPricePerUser, setSuggestedPricePerUser] = useState<number | null>(null);

  useEffect(() => {
    loadJournalTypes();
  }, []);

  async function loadJournalTypes() {
    try {
      const res = await fetch("/api/admin/journal-types");
      const data = await res.json();
      setJournalTypes(
        data
          .filter((jt: JournalType) => jt.isActive)
          .map((jt: any) => ({
            id: jt.id,
            name: jt.name,
            isActive: jt.isActive,
            frequency: jt.frequency,
            unitPrice: Number(jt.unitPrice),
            monthlyPrice: Number(jt.monthlyPrice),
            sixMonthPrice: Number(jt.sixMonthPrice),
            yearlyPrice: Number(jt.yearlyPrice)
          }))
      );
    } catch (err) {
      console.error("Erreur chargement types de journaux:", err);
    }
  }

  function toggleJournalType(id: string) {
    setSelectedJournalTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Calcule un prix suggéré à partir des types de journaux sélectionnés et de la durée
  useEffect(() => {
    if (selectedJournalTypes.length === 0) {
      setSuggestedBasePrice(null);
      setSuggestedPricePerUser(null);
      return;
    }

    const selected = journalTypes.filter((jt) => selectedJournalTypes.includes(jt.id));
    if (selected.length === 0) {
      setSuggestedBasePrice(null);
      setSuggestedPricePerUser(null);
      return;
    }

    const priceForDuration = (jt: JournalType) => {
      switch (durationMonths) {
        case 1:
          return jt.monthlyPrice > 0 ? jt.monthlyPrice : jt.unitPrice;
        case 3:
          return (jt.monthlyPrice > 0 ? jt.monthlyPrice : jt.unitPrice) * 3;
        case 6:
          if (jt.sixMonthPrice > 0) return jt.sixMonthPrice;
          return (jt.monthlyPrice > 0 ? jt.monthlyPrice : jt.unitPrice) * 6;
        case 12:
          if (jt.yearlyPrice > 0) return jt.yearlyPrice;
          return (jt.monthlyPrice > 0 ? jt.monthlyPrice : jt.unitPrice) * 12;
        case 24:
          // 2 ans = 2x annuel si dispo, sinon 24 x mensuel
          if (jt.yearlyPrice > 0) return jt.yearlyPrice * 2;
          return (jt.monthlyPrice > 0 ? jt.monthlyPrice : jt.unitPrice) * 24;
        default:
          return (jt.monthlyPrice > 0 ? jt.monthlyPrice : jt.unitPrice) * durationMonths;
      }
    };

    const totalSuggested = selected.reduce((sum, jt) => sum + priceForDuration(jt), 0);
    setSuggestedBasePrice(Math.round(totalSuggested));

    // Pour B2B, suggérer un prix par utilisateur basé sur le mensuel * durée
    const perUserSuggested = selected.reduce((sum, jt) => {
      const monthly = jt.monthlyPrice > 0 ? jt.monthlyPrice : jt.unitPrice;
      return sum + monthly * durationMonths;
    }, 0) / selected.length;
    setSuggestedPricePerUser(Math.round(perUserSuggested));

    // Si l'utilisateur n'a pas encore saisi de prix, pré-remplir
    if (!basePriceManuallyEdited && totalSuggested > 0 && targetAudience === "INDIVIDUAL") {
      setBasePrice(totalSuggested.toString());
    }
    if (!pricePerUserManuallyEdited && perUserSuggested > 0 && targetAudience === "ENTERPRISE") {
      setPricePerUser(Math.round(perUserSuggested).toString());
    }
  }, [selectedJournalTypes, journalTypes, durationMonths, targetAudience, basePriceManuallyEdited, pricePerUserManuallyEdited]);

  function applySuggestions() {
    if (suggestedBasePrice && targetAudience === "INDIVIDUAL") {
      setBasePrice(suggestedBasePrice.toString());
      setBasePriceManuallyEdited(false);
    }
    if (suggestedPricePerUser && targetAudience === "ENTERPRISE") {
      setPricePerUser(suggestedPricePerUser.toString());
      setPricePerUserManuallyEdited(false);
    }
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
    setLoading(true);

    try {
      const res = await fetch("/api/admin/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          description: description || null,
          targetAudience,
          durationMonths,
          basePrice: parseFloat(basePrice),
          currency,
          // Champs entreprise (seulement si ENTERPRISE)
          pricePerUser: targetAudience === "ENTERPRISE" && pricePerUser ? parseFloat(pricePerUser) : null,
          minUsers: targetAudience === "ENTERPRISE" && minUsers ? parseInt(minUsers) : null,
          maxUsers: targetAudience === "ENTERPRISE" && maxUsers ? parseInt(maxUsers) : null,
          journalTypeIds: selectedJournalTypes,
          advantages: advantages.filter((a) => a.trim() !== ""),
          highlight,
          badge: badge || null,
          displayOrder,
          isActive: true,
          isPublic
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur création");
      }

      router.push("/admin/subscription-plans?success=created");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Nouveau plan d'abonnement"
            subtitle="Configurez une nouvelle formule d'abonnement."
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
                    placeholder="Ex: Abonnement Duo 6 mois"
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
                  placeholder="Description courte du plan..."
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
                    onChange={(e) => {
                      setBasePrice(e.target.value);
                      setBasePriceManuallyEdited(true);
                    }}
                    placeholder="50000"
                    min={0}
                    required
                  />
                  {targetAudience === "ENTERPRISE" && (
                    <p className="mt-1 text-xs text-slate-500">Frais fixes du plan</p>
                  )}
                  {targetAudience === "INDIVIDUAL" && suggestedBasePrice ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Suggestion (d'après les journaux sélectionnés) : {suggestedBasePrice} {currency}
                    </p>
                  ) : null}
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
                        onChange={(e) => {
                          setPricePerUser(e.target.value);
                          setPricePerUserManuallyEdited(true);
                        }}
                        placeholder="10000"
                        min={0}
                        required={targetAudience === "ENTERPRISE"}
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Total = Prix de base + (Prix/utilisateur × Nb utilisateurs)
                      </p>
                      {suggestedPricePerUser ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Suggestion (moyenne mensuelle × durée) : {suggestedPricePerUser} {currency}
                        </p>
                      ) : null}
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
                Journaux inclus * 
                <span className="text-xs font-normal text-slate-500 ml-2">
                  ({selectedJournalTypes.length} sélectionné{selectedJournalTypes.length > 1 ? "s" : ""})
                </span>
              </h3>
              
              {journalTypes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aucun type de journal actif.{" "}
                  <Link href="/admin/journal-types" className="text-emerald-600 hover:underline">
                    Créer un type
                  </Link>
                </p>
              ) : (
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
                      <span className="text-xs text-slate-500">
                        Mensuel: {jt.monthlyPrice} | 6 mois: {jt.sixMonthPrice} | Annuel: {jt.yearlyPrice}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {selectedJournalTypes.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Récapitulatif tarifs suggérés</div>
                    <button
                      type="button"
                      onClick={applySuggestions}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Appliquer les suggestions
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {journalTypes
                      .filter((jt) => selectedJournalTypes.includes(jt.id))
                      .map((jt) => (
                        <div key={jt.id} className="flex items-center justify-between">
                          <span>{jt.name}</span>
                          <span>
                            {durationMonths} mois →{" "}
                            {(() => {
                              switch (durationMonths) {
                                case 1:
                                  return jt.monthlyPrice || jt.unitPrice;
                                case 3:
                                  return (jt.monthlyPrice || jt.unitPrice) * 3;
                                case 6:
                                  return jt.sixMonthPrice || (jt.monthlyPrice || jt.unitPrice) * 6;
                                case 12:
                                  return jt.yearlyPrice || (jt.monthlyPrice || jt.unitPrice) * 12;
                                case 24:
                                  return jt.yearlyPrice ? jt.yearlyPrice * 2 : (jt.monthlyPrice || jt.unitPrice) * 24;
                                default:
                                  return (jt.monthlyPrice || jt.unitPrice) * durationMonths;
                              }
                            })()}{" "}
                            {currency}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
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
                  + Ajouter un avantage
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

            {/* Options d'affichage */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Options d'affichage</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={highlight}
                    onChange={(e) => setHighlight(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Mettre en avant (highlight)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700">Visible publiquement</span>
                </label>
              </div>

              {highlight && (
                <div>
                  <Label htmlFor="badge">Badge (texte)</Label>
                  <Input
                    id="badge"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Populaire, Meilleure offre..."
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <Link href="/admin/subscription-plans">
                <ButtonSecondary type="button">Annuler</ButtonSecondary>
              </Link>
              <ButtonPrimary type="submit" disabled={loading || selectedJournalTypes.length === 0}>
                {loading ? "Création..." : "Créer le plan"}
              </ButtonPrimary>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
