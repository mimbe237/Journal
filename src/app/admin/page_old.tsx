import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { ExportButtons } from "@/modules/admin/components/ExportButtons";

// Tableau de bord admin (placeholder, à brancher aux données réelles).
export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <PageHeader
          title="Tableau de bord Administrateur"
          subtitle="Surveillez les abonnements, éditions et statistiques."
          actions={<ExportButtons />}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Abonnés</h2>
            <p className="text-sm text-slate-600">Nombre d’abonnés actifs (TODO : données réelles).</p>
            <Link href="/admin/subscribers">
              <ButtonSecondary className="w-full justify-center" disabled>
                Voir la liste (TODO)
              </ButtonSecondary>
            </Link>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Éditions</h2>
            <p className="text-sm text-slate-600">Charger et gérer les éditions du journal.</p>
            <Link href="/admin/editions">
              <ButtonPrimary className="w-full justify-center">Gérer les éditions</ButtonPrimary>
            </Link>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Exports</h2>
            <p className="text-sm text-slate-600">Exports CSV abonnés / abonnements / stats.</p>
            <ExportButtons />
          </Card>
        </div>
      </div>
    </div>
  );
}
