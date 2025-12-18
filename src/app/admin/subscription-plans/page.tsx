"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";

type JournalType = {
  id: string;
  name: string;
};

type SubscriptionPlan = {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  targetAudience: "INDIVIDUAL" | "ENTERPRISE";
  durationMonths: number;
  basePrice: number;
  pricePerUser: number | null;
  minUsers: number | null;
  maxUsers: number | null;
  currency: string;
  advantages: string[];
  highlight: boolean;
  badge: string | null;
  displayOrder: number;
  isActive: boolean;
  isPublic: boolean;
  journalTypes: { journalType: JournalType }[];
};

export default function SubscriptionPlansAdminPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/admin/subscription-plans?admin=true");
      if (!res.ok) throw new Error("Erreur chargement");
      const data = await res.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(plan: SubscriptionPlan) {
    try {
      await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive })
      });
      loadPlans();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <LoadingState message="Chargement des plans..." />;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Configuration des Abonnements"
            subtitle="Créez et gérez les formules d'abonnement disponibles pour vos utilisateurs."
          />
          <Link href="/admin/subscription-plans/new">
            <ButtonPrimary>+ Nouveau plan</ButtonPrimary>
          </Link>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {plans.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucun plan configuré</h3>
            <p className="mt-2 text-sm text-slate-600">
              Créez votre premier plan d'abonnement pour le proposer aux utilisateurs.
            </p>
            <Link href="/admin/subscription-plans/new">
              <ButtonPrimary className="mt-4">Créer un plan</ButtonPrimary>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${!plan.isActive ? "opacity-60" : ""}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                      {plan.badge || "Populaire"}
                    </span>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{plan.nom}</h3>
                      <p className="text-xs text-slate-500">{plan.slug}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        plan.isActive 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {plan.isActive ? "Actif" : "Inactif"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        plan.targetAudience === "ENTERPRISE"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-violet-100 text-violet-700"
                      }`}>
                        {plan.targetAudience === "ENTERPRISE" ? "Entreprise" : "Particulier"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-slate-900">
                      {Number(plan.basePrice).toLocaleString("fr-FR")}
                    </span>
                    <span className="text-sm text-slate-500 ml-1">
                      {plan.currency} / {plan.durationMonths} mois
                    </span>
                    {plan.targetAudience === "ENTERPRISE" && plan.pricePerUser && (
                      <div className="mt-1 text-xs text-blue-600">
                        + {Number(plan.pricePerUser).toLocaleString("fr-FR")} {plan.currency}/utilisateur
                        {plan.minUsers && <span className="text-slate-500"> (min: {plan.minUsers})</span>}
                      </div>
                    )}
                  </div>

                  {plan.description && (
                    <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  )}

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Journaux inclus
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {plan.journalTypes.map(({ journalType }) => (
                        <span
                          key={journalType.id}
                          className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {journalType.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {plan.advantages.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Avantages
                      </p>
                      <ul className="space-y-1">
                        {(plan.advantages as string[]).slice(0, 3).map((adv, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="text-emerald-500">✓</span> {adv}
                          </li>
                        ))}
                        {plan.advantages.length > 3 && (
                          <li className="text-xs text-slate-400">
                            +{plan.advantages.length - 3} autres
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex gap-2">
                    <Link href={`/admin/subscription-plans/${plan.id}`} className="flex-1">
                      <ButtonSecondary className="w-full">Modifier</ButtonSecondary>
                    </Link>
                    <button
                      onClick={() => toggleActive(plan)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        plan.isActive
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {plan.isActive ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
