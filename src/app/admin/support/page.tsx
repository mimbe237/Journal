"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonSecondary } from "@/components/ui/Button";

export default function SupportDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          title="Espace Support"
          subtitle="Gestion des éditions, utilisateurs et assistance technique."
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Éditions</h3>
            <p className="text-sm text-slate-600">
              Gérez les publications du journal (upload PDF, couvertures).
            </p>
            <Link href="/admin/editions">
              <ButtonSecondary className="w-full justify-center">Gérer les éditions</ButtonSecondary>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Utilisateurs</h3>
            <p className="text-sm text-slate-600">
              Recherchez et gérez les comptes utilisateurs (reset mot de passe, infos).
            </p>
            <Link href="/admin/users">
              <ButtonSecondary className="w-full justify-center">Gérer les utilisateurs</ButtonSecondary>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Entreprises</h3>
            <p className="text-sm text-slate-600">
              Consultez les comptes entreprises et leurs utilisateurs.
            </p>
            <Link href="/admin/enterprises">
              <ButtonSecondary className="w-full justify-center">Voir les entreprises</ButtonSecondary>
            </Link>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Codes Promo</h3>
            <p className="text-sm text-slate-600">
              Créez et modifiez les codes promotionnels.
            </p>
            <Link href="/admin/promocodes">
              <ButtonSecondary className="w-full justify-center">Gérer les codes promo</ButtonSecondary>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
