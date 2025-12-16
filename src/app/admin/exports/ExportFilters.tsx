"use client";

import { useState } from "react";

export type ExportFiltersState = {
  status: string;
  startDate: string;
  endDate: string;
  subscriberType: string;
  journalTypeId: string;
  paymentMethod: string;
};

export const initialExportFilters: ExportFiltersState = {
  status: "all",
  startDate: "",
  endDate: "",
  subscriberType: "all",
  journalTypeId: "",
  paymentMethod: "all",
};

export function ExportFilters({
  journalTypes,
  onApply,
}: {
  journalTypes: Array<{ id: string; name: string }>;
  onApply: (filters: ExportFiltersState) => void;
}) {
  const [filters, setFilters] = useState<ExportFiltersState>(initialExportFilters);

  const handleChange = (key: keyof ExportFiltersState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">Statut</label>
        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="ACTIF">Actif</option>
          <option value="EXPIRE">Expiré</option>
          <option value="SUSPENDU">Suspendu</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Type d’abonné</label>
        <select
          value={filters.subscriberType}
          onChange={(e) => handleChange("subscriberType", e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="individual">Individuel</option>
          <option value="enterprise">Entreprise</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Journal</label>
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
        <label className="block text-sm font-medium text-slate-700">Période début</label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Période fin</label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleChange("endDate", e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Mode de paiement</label>
        <select
          value={filters.paymentMethod}
          onChange={(e) => handleChange("paymentMethod", e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">Tous</option>
          <option value="CASH">Cash</option>
          <option value="MOBILE">Mobile</option>
          <option value="VISA">Visa/CB</option>
          <option value="AUTRE">Autre</option>
        </select>
      </div>
      <div className="md:col-span-3 flex items-center justify-end gap-3">
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
