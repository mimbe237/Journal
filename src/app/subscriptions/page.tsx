"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SubscriptionType } from "@prisma/client";

type PlanOption = {
  type: SubscriptionType;
  label: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  badge?: string;
};

const INDIVIDUAL_PLANS: PlanOption[] = [
  {
    type: SubscriptionType.MENSUEL,
    label: "Mensuel",
    description: "Accès complet pendant 1 mois",
    price: 2500,
    durationDays: 30,
    features: ["Toutes les éditions", "Lecture illimitée", "Annulation possible"]
  },
  {
    type: SubscriptionType.ANNUEL,
    label: "Annuel",
    description: "Accès complet pendant 1 an (meilleur prix)",
    price: 25000,
    durationDays: 365,
    features: ["Toutes les éditions", "Lecture illimitée", "Support prioritaire", "Économies de 17%"],
    badge: "Meilleur prix"
  },
  {
    type: SubscriptionType.TEST,
    label: "Essai gratuit",
    description: "7 jours d'accès complet",
    price: 0,
    durationDays: 7,
    features: ["Accès complet 7 jours", "Sans engagement"]
  }
];

const ENTERPRISE_PLANS: PlanOption[] = [
  {
    type: SubscriptionType.MENSUEL,
    label: "Entreprise mensuel",
    description: "Accès complet pour l'équipe pendant 1 mois",
    price: 8500,
    durationDays: 30,
    features: ["Multi-utilisateurs (jusqu'à 5)", "Lecture illimitée", "Support prioritaire"]
  },
  {
    type: SubscriptionType.ANNUEL,
    label: "Entreprise annuel",
    description: "Tarif préférentiel annuel",
    price: 85000,
    durationDays: 365,
    features: ["Multi-utilisateurs (jusqu'à 10)", "Support dédié", "Économies de 15%"],
    badge: "Populaire"
  }
];

export default function SubscriptionsPage() {
  const [segment, setSegment] = useState<"individual" | "enterprise">("individual");
  const [currentPlanType, setCurrentPlanType] = useState<SubscriptionType | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadCurrent() {
      try {
        const res = await fetch("/api/subscriptions/active", { credentials: "include", cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (json?.subscription?.type) {
          setCurrentPlanType(json.subscription.type as SubscriptionType);
        }
      } catch {
        // silencieux si non connecté
      }
    }
    loadCurrent();
    return () => {
      cancelled = true;
    };
  }, []);

  const plans = useMemo(() => (segment === "enterprise" ? ENTERPRISE_PLANS : INDIVIDUAL_PLANS), [segment]);
  const currentPrice = useMemo(() => {
    const plan = plans.find((p) => p.type === currentPlanType);
    return plan?.price ?? null;
  }, [plans, currentPlanType]);

  async function handleChoosePlan(plan: PlanOption) {
    setLoading(plan.type);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionType: plan.type,
          amount: plan.price,
          currency: "XAF",
          durationDays: plan.durationDays
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur checkout");

      // Redirection vers la page de paiement fictive
      window.location.href = json.checkoutUrl;
    } catch (err: any) {
      setError(err?.message ?? "Erreur checkout");
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Nos offres</p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Choisissez votre abonnement</h1>
          <p className="mt-3 text-base text-slate-600">
            Accédez à toutes les éditions du journal avec l'abonnement qui vous convient.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {[
              { key: "individual", label: "Individuel" },
              { key: "enterprise", label: "Entreprise" }
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSegment(opt.key as "individual" | "enterprise")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  segment === opt.key
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600 hover:text-emerald-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {currentPlanType && (
            <p className="mt-3 text-sm text-emerald-700">
              Plan actuel : <span className="font-semibold">{currentPlanType}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.type === currentPlanType;
            const isUpgrade = currentPrice !== null && plan.price > currentPrice && !isCurrent;
            return (
            <Card
              key={plan.type}
              className={`flex flex-col gap-4 border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                isCurrent ? "ring-2 ring-emerald-400" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{plan.label}</h2>
                  <p className="text-sm text-slate-500">{plan.description}</p>
                </div>
                {(isCurrent || plan.badge) && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isCurrent
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-emerald-600/10 text-emerald-700"
                    }`}
                  >
                    {isCurrent ? "Plan actuel" : plan.badge}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{plan.price.toLocaleString()}</span>
                  <span className="text-slate-500">FCFA</span>
                </div>
                <p className="text-xs text-slate-500">{plan.durationDays} jours d'accès</p>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <ButtonPrimary
                  onClick={() => handleChoosePlan(plan)}
                  disabled={loading === plan.type || isCurrent}
                  className={`w-full justify-center ${isCurrent ? "bg-slate-300 text-slate-600 hover:bg-slate-300" : ""}`}
                >
                  {isCurrent
                    ? "Plan actuel"
                    : loading === plan.type
                    ? "Redirection..."
                    : isUpgrade
                    ? "Passer à cette offre"
                    : plan.price === 0
                    ? "Commencer l'essai"
                    : "Choisir ce plan"}
                </ButtonPrimary>
              </div>
            </Card>
          )})}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Besoin d'aide ?{" "}
            <Link href="/contact" className="text-emerald-400 underline hover:text-emerald-300">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
