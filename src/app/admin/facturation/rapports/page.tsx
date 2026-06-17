"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExportButtons } from "@/modules/admin/components/ExportButtons";
import { RevenueChart } from "@/components/admin/RevenueChart";

export default function FinancialReportsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          title="Rapports Financiers"
          subtitle="Exports et analyses des données de facturation."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Exports CSV</h3>
            <p className="text-sm text-slate-600">
              Téléchargez les données brutes pour analyse externe (Excel, outils comptables).
            </p>
            <div className="pt-2">
              <ExportButtons />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Aperçu des ventes</h3>
            <RevenueChart />
          </Card>
        </div>
      </div>
    </div>
  );
}
