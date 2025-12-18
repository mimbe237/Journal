"use client";

import { useEffect, useMemo, useState } from "react";
import { resolvePreset, PeriodPreset } from "@/modules/export/filterPresets";

export type ExportFiltersState = {
  // Période
  periodPreset: PeriodPreset;
  startDate: string;
  endDate: string;
  // Cible
  status: string;
  subscriberType: "all" | "individual" | "enterprise";
  enterpriseId: string;
  journalTypeId: string;
  subscriptionType: string;
  // Paiement / vente
  source: "all" | "OFFLINE" | "ONLINE";
  currency: string;
  hasPromo: "all" | "yes" | "no";
};

const presetDefaults = resolvePreset("last_30_days");

export const initialExportFilters: ExportFiltersState = {
  periodPreset: "last_30_days",
  startDate: presetDefaults.startDate || "",
  endDate: presetDefaults.endDate || "",
  status: "all",
  subscriberType: "all",
  enterpriseId: "",
  journalTypeId: "",
  subscriptionType: "",
  source: "all",
  currency: "",
  hasPromo: "all",
};

export function ExportFilters({
  journalTypes,
  enterprises,
  subscriptionTypes,
  onApply,
}: {
  journalTypes: Array<{ id: string; name: string }>;
  enterprises: Array<{ id: string; name: string }>;
  subscriptionTypes: Array<{ value: string; label: string }>;
  onApply: (filters: ExportFiltersState) => void;
}) {
  const [filters, setFilters] = useState<ExportFiltersState>(initialExportFilters);

  useEffect(() => {
    const resolved = resolvePreset(filters.periodPreset, filters.startDate, filters.endDate);
    setFilters((prev) => ({
      ...prev,
      startDate: resolved.startDate || "",
      endDate: resolved.endDate || "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.periodPreset]);

  const handleChange = <K extends keyof ExportFiltersState>(key: K, value: ExportFiltersState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters);
  };

  const filterChips = useMemo(() => {
    const chips: string[] = [];
    if (filters.status !== "all") chips.push(`Statut: ${filters.status}`);
    if (filters.subscriberType !== "all") chips.push(filters.subscriberType === "enterprise" ? "Entreprises" : "Individuels");
    if (filters.enterpriseId) chips.push(`Entreprise: ${enterprises.find((e) => e.id === filters.enterpriseId)?.name ?? filters.enterpriseId}`);
    if (filters.journalTypeId) chips.push(`Journal: ${journalTypes.find((j) => j.id === filters.journalTypeId)?.name ?? filters.journalTypeId}`);
    if (filters.subscriptionType) chips.push(`Type abo: ${subscriptionTypes.find((t) => t.value === filters.subscriptionType)?.label ?? filters.subscriptionType}`);
    if (filters.source !== "all") chips.push(filters.source === "ONLINE" ? "Online" : "Offline");
    if (filters.currency) chips.push(`Devise: ${filters.currency}`);
    if (filters.hasPromo === "yes") chips.push("Avec promo");
    if (filters.hasPromo === "no") chips.push("Sans promo");
    if (filters.startDate || filters.endDate) chips.push(`Période: ${filters.startDate || "?"} → ${filters.endDate || "?"}`);
    return chips;
  }, [filters, enterprises, journalTypes]);

  const reset = () => setFilters(initialExportFilters);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Période</label>
          <select
            value={filters.periodPreset}
            onChange={(e) => handleChange("periodPreset", e.target.value as PeriodPreset)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="this_month">Mois en cours</option>
            <option value="last_month">Mois précédent</option>
            <option value="last_7_days">7 derniers jours</option>
            <option value="last_30_days">30 derniers jours</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Début</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            disabled={filters.periodPreset !== "custom"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Fin</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            disabled={filters.periodPreset !== "custom"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Statut abonnement</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            <option value="ACTIF">Actif</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="EXPIRE">Expiré</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="ANNULE">Annulé</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Type d’abonné</label>
          <select
            value={filters.subscriberType}
            onChange={(e) => handleChange("subscriberType", e.target.value as ExportFiltersState["subscriberType"])}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            <option value="individual">Individuel</option>
            <option value="enterprise">Entreprise</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Entreprise</label>
          <select
            value={filters.enterpriseId}
            onChange={(e) => handleChange("enterpriseId", e.target.value)}
            disabled={filters.subscriberType === "individual"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value="">Toutes</option>
            {enterprises.map((ent) => (
              <option key={ent.id} value={ent.id}>
                {ent.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Journal</label>
          <select
            value={filters.journalTypeId}
            onChange={(e) => handleChange("journalTypeId", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {journalTypes.map((jt) => (
              <option key={jt.id} value={jt.id}>
                {jt.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Type d’abonnement</label>
          <select
            value={filters.subscriptionType}
            onChange={(e) => handleChange("subscriptionType", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {subscriptionTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Source</label>
          <select
            value={filters.source}
            onChange={(e) => handleChange("source", e.target.value as ExportFiltersState["source"])}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Toutes</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Devise</label>
          <input
            type="text"
            value={filters.currency}
            placeholder="XAF, EUR..."
            onChange={(e) => handleChange("currency", e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Code promo</label>
          <select
            value={filters.hasPromo}
            onChange={(e) => handleChange("hasPromo", e.target.value as ExportFiltersState["hasPromo"])}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            <option value="yes">Avec promo</option>
            <option value="no">Sans promo</option>
          </select>
        </div>
      </div>

      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          {filterChips.map((chip, idx) => (
            <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
              {chip}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Prévisualiser
        </button>
      </div>
    </form>
  );
}
