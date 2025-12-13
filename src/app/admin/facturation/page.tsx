"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonSecondary } from "@/components/ui/Button";

export default function FacturationDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          title="Espace Facturation"
          subtitle="Gestion des abonnements, paiements et soumissions manuelles."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Soumissions Manuelles</h3>
            <p className="text-sm text-slate-600">
              Gérez les demandes d'abonnement payées hors ligne (espèces, virement, chèque).
            </p>
            <Link href="/admin/facturation/soumissions">
              <ButtonSecondary className="w-full justify-center">Voir les demandes</ButtonSecondary>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Abonnements</h3>
            <p className="text-sm text-slate-600">
              Consultez la liste de tous les abonnements actifs et leur statut.
            </p>
            <Link href="/admin/subscriptions">
              <ButtonSecondary className="w-full justify-center">Gérer les abonnements</ButtonSecondary>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Rapports Financiers</h3>
            <p className="text-sm text-slate-600">
              Exportez les données de facturation et les statistiques de vente.
            </p>
            <Link href="/admin/facturation/rapports">
              <ButtonSecondary className="w-full justify-center">Accéder aux rapports</ButtonSecondary>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
