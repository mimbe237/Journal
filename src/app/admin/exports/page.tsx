"use client";

import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExportFilters, ExportFiltersState, initialExportFilters } from "./ExportFilters";
import { PreviewTable } from "./PreviewTable";

type JournalTypeOption = { id: string; name: string };
type EnterpriseOption = { id: string; name: string };
const subscriptionTypeOptions = [
  { value: "MENSUEL", label: "Mensuel" },
  { value: "ANNUEL", label: "Annuel" },
  { value: "OFFERT", label: "Offert" },
  { value: "PROMOTIONNEL", label: "Promotionnel" },
  { value: "TEST", label: "Test" },
];

export default function ExportsPage() {
  const [journalTypes, setJournalTypes] = useState<JournalTypeOption[]>([]);
  const [enterprises, setEnterprises] = useState<EnterpriseOption[]>([]);
  const [filters, setFilters] = useState<ExportFiltersState>(initialExportFilters);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const fetchJournalTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/journal-types");
      if (!res.ok) throw new Error("Impossible de charger les types de journaux");
      const data = await res.json();
      const activeTypes = Array.isArray(data) ? data.filter((jt: any) => jt.isActive) : [];
      setJournalTypes(activeTypes.map((jt: any) => ({ id: jt.id, name: jt.name })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue lors du chargement des types");
    }
  }, []);

  const fetchEnterprises = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/enterprises?take=200");
      if (!res.ok) throw new Error("Impossible de charger les entreprises");
      const data = await res.json();
      setEnterprises(
        Array.isArray(data?.enterprises)
          ? data.enterprises.map((e: any) => ({ id: e.id, name: e.nom }))
          : []
      );
    } catch (err) {
      // on ne bloque pas les exports si l'API entreprises ne répond pas
      console.error(err);
    }
  }, []);

  const fetchPreview = useCallback(
    async (payload: ExportFiltersState) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/export/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erreur lors de la prévisualisation");
        }
        const data = await res.json();
        setRows(data.rows || []);
        setFilters(payload);
      } catch (err) {
        setRows([]);
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchJournalTypes();
    fetchEnterprises();
    fetchPreview(initialExportFilters);
  }, [fetchJournalTypes, fetchEnterprises, fetchPreview]);

  const handleApplyFilters = (nextFilters: ExportFiltersState) => {
    fetchPreview(nextFilters);
  };

  const handleExport = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/export/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export impossible");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "abonnements.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue lors de l'export");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exports"
        description="Prévisualisez les données filtrées puis exportez-les en CSV."
      />

      <Card className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Filtres recommandés</h3>
            <p className="text-sm text-slate-500">
              Filtrez d'abord les abonnements (statut, période, type, mode de paiement). Le tableau
              ci-dessous reflète les résultats, puis vous pouvez exporter.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading || downloading || rows.length === 0}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {downloading ? "Export..." : "Exporter (CSV)"}
          </button>
        </div>

        <ExportFilters
          journalTypes={journalTypes}
          enterprises={enterprises}
          subscriptionTypes={subscriptionTypeOptions}
          onApply={handleApplyFilters}
        />

        <PreviewTable rows={rows} loading={loading} error={error} />
      </Card>
    </div>
  );
}
