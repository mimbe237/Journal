"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type JournalType = {
  id: string;
  name: string;
};

type SubscriptionPlan = {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  durationMonths: number;
  price: number;
  currency: string;
  advantages: string[];
  highlight: boolean;
  badge: string | null;
  journalTypes: JournalType[];
};

function formatPrice(price: number, currency: string): string {
  if (currency === "XAF") {
    return `${price.toLocaleString("fr-FR")} FCFA`;
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(price);
}

function formatDuration(months: number): string {
  if (months === 1) return "/mois";
  if (months === 12) return "/an";
  return `/${months} mois`;
}

export function DynamicPricingPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/subscription-plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (err) {
        console.error("Erreur chargement des plans:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl bg-slate-100 p-8 h-80" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Les formules d'abonnement seront bientôt disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm transition-all hover:shadow-lg ${
            plan.highlight
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow-md">
                {plan.badge}
              </span>
            </div>
          )}

          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{plan.nom}</h3>
            {plan.description && (
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
            )}
          </div>

          <div className="mt-6 text-center">
            <span className="text-4xl font-bold text-slate-900">
              {formatPrice(plan.price, plan.currency)}
            </span>
            <span className="text-slate-600">{formatDuration(plan.durationMonths)}</span>
          </div>

          {plan.journalTypes.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Journaux inclus
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {plan.journalTypes.map((jt) => (
                  <span
                    key={jt.id}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {jt.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ul className="mt-6 space-y-3">
            {(plan.advantages as string[]).map((advantage, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="flex-shrink-0 text-emerald-500">✓</span>
                {advantage}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href={`/subscriptions?plan=${plan.slug}`}
              className={`block w-full rounded-lg py-3 text-center font-semibold transition ${
                plan.highlight
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              Choisir ce plan
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

// Version statique pour fallback SSR (plans par défaut)
export function StaticPricingPlans({ plans }: { plans: SubscriptionPlan[] }) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Les formules d'abonnement seront bientôt disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-2xl border-2 bg-white p-8 shadow-sm transition-all hover:shadow-lg ${
            plan.highlight
              ? "border-emerald-500 ring-2 ring-emerald-500/20"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-bold text-white shadow-md">
                {plan.badge}
              </span>
            </div>
          )}

          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{plan.nom}</h3>
            {plan.description && (
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
            )}
          </div>

          <div className="mt-6 text-center">
            <span className="text-4xl font-bold text-slate-900">
              {formatPrice(plan.price, plan.currency)}
            </span>
            <span className="text-slate-600">{formatDuration(plan.durationMonths)}</span>
          </div>

          {plan.journalTypes.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Journaux inclus
              </p>
              <div className="flex flex-wrap justify-center gap-1">
                {plan.journalTypes.map((jt) => (
                  <span
                    key={jt.id}
                    className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {jt.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ul className="mt-6 space-y-3">
            {(plan.advantages as string[]).map((advantage, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="flex-shrink-0 text-emerald-500">✓</span>
                {advantage}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href={`/subscriptions?plan=${plan.slug}`}
              className={`block w-full rounded-lg py-3 text-center font-semibold transition ${
                plan.highlight
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              Choisir ce plan
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
