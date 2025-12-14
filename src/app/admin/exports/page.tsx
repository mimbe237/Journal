"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExportButtons } from "@/modules/admin/components/ExportButtons";

export default function ExportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Exports" 
        description="Télécharger les données de la plateforme au format CSV." 
      />
      
      <Card className="p-6">
        <h3 className="text-lg font-medium text-slate-100 mb-4">Exports disponibles</h3>
        <p className="text-slate-400 mb-6">
          Cliquez sur les boutons ci-dessous pour télécharger les rapports CSV correspondants.
        </p>
        <ExportButtons />
      </Card>
    </div>
  );
}
