import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";

// Dashboard abonné (placeholder, à connecter aux données réelles).
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
        <PageHeader title="Mon espace abonné" subtitle="Gérez votre profil et votre abonnement." />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Mon profil</h2>
            <p className="text-sm text-slate-600">Nom, email, coordonnées.</p>
            <ButtonSecondary disabled className="w-fit">
              Modifier mes informations (TODO)
            </ButtonSecondary>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Mon abonnement</h2>
            <p className="text-sm text-slate-600">Type, statut, date de fin.</p>
            <div className="text-sm text-slate-500">TODO : brancher les données d’abonnement réelles.</div>
            <ButtonPrimary disabled className="w-fit">
              Renouveler (TODO)
            </ButtonPrimary>
          </Card>
        </div>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Historique de lecture</h2>
          <p className="text-sm text-slate-600">
            Statistiques de lecture et dernières éditions consultées (TODO : brancher ReadingSession).
          </p>
        </Card>
      </div>
    </div>
  );
}
