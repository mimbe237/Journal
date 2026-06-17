"use client";

import { useMemo } from "react";

type PreviewRow = {
  id: string;
  label: string;
  subscriberType: string;
  enterprise: string | null;
  journal: string | null;
  status: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  montant: number | null;
  devise: string | null;
  source: string | null;
  hasPromo?: boolean;
};

export function PreviewTable({
  rows,
  loading,
  error,
}: {
  rows: PreviewRow[];
  loading: boolean;
  error: string | null;
}) {
  const totals = useMemo(() => {
    const agg: Record<string, number> = {};
    rows.forEach((r) => {
      if (r.montant && r.devise) {
        const key = r.devise.toUpperCase();
        agg[key] = (agg[key] ?? 0) + r.montant;
      }
    });
    return agg;
  }, [rows]);

  if (loading) {
    return <div className="p-4 text-sm text-slate-500">Chargement...</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600">Erreur : {error}</div>;
  }

  if (!rows.length) {
    return <div className="p-4 text-sm text-slate-500">Aucun résultat pour ces filtres.</div>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Abonné</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Entreprise</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Journal</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Statut</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Début</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Fin</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Montant</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Source</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Promo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-medium text-slate-900">{r.label}</td>
                <td className="px-3 py-2 text-slate-700">{r.subscriberType}</td>
                <td className="px-3 py-2 text-slate-700">{r.enterprise || "-"}</td>
                <td className="px-3 py-2 text-slate-700">{r.journal || "-"}</td>
                <td className="px-3 py-2 text-slate-700">{r.status || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{r.dateDebut || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{r.dateFin || "-"}</td>
                <td className="px-3 py-2 text-slate-900">
                  {r.montant != null && r.devise ? `${r.montant} ${r.devise}` : "-"}
                </td>
                <td className="px-3 py-2 text-slate-700">{r.source || "-"}</td>
                <td className="px-3 py-2 text-slate-700">{r.hasPromo ? "Oui" : "Non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <div className="font-semibold mb-1">Totaux par devise</div>
        {Object.keys(totals).length === 0 ? (
          <div className="text-slate-500">Aucun montant agrégé.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {Object.entries(totals).map(([dev, sum]) => (
              <span key={dev} className="rounded bg-slate-200 px-2 py-1">
                {dev}: {sum}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
