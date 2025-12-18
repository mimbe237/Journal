"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary } from "@/components/ui/Button";

interface PublicPlan {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  targetAudience: "INDIVIDUAL" | "ENTERPRISE";
  durationMonths: number;
  basePrice: number;
  pricePerUser: number | null;
  calculatedPrice: number;
  minUsers: number | null;
  maxUsers: number | null;
  currency: string;
  advantages: string[];
  highlight: boolean;
  badge: string | null;
  journalTypes: { id: string; name: string }[];
}

interface ActiveSubscription {
  id: string;
  type: string;
  planId?: string;
}

export default function SubscriptionsPage() {
  const searchParams = useSearchParams();
  const [segment, setSegment] = useState<"INDIVIDUAL" | "ENTERPRISE">("INDIVIDUAL");
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<ActiveSubscription | null>(null);

  // Fetch current subscription
  useEffect(() => {
    async function loadCurrent() {
      try {
        const res = await fetch("/api/subscriptions/active", { credentials: "include", cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.subscription) {
          setCurrentSubscription(json.subscription);
        }
      } catch {
        // Silent if not logged in
      }
    }
    loadCurrent();
  }, []);

  // Fetch plans based on segment
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscription-plans?audience=${segment}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des plans");
      const data = await res.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [segment]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle plan selection
  async function handleChoosePlan(plan: PublicPlan) {
    setCheckoutLoading(plan.id);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          subscriptionType: plan.durationMonths === 1 ? "MENSUEL" : plan.durationMonths === 12 ? "ANNUEL" : "AUTRE",
          amount: plan.calculatedPrice,
          currency: plan.currency,
          durationDays: plan.durationMonths * 30
        })
      });

      if (res.status === 401) {
        window.location.href = "/auth/login?redirect=/subscriptions";
        return;
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erreur checkout");

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      // Free subscription: refresh state
      setCheckoutLoading(null);
      setCurrentSubscription({ id: json.subscriptionId, type: "ACTIVE", planId: plan.id });
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Erreur checkout");
      setCheckoutLoading(null);
    }
  }

  // Get duration label
  const getDurationLabel = (months: number) => {
    if (months === 1) return "30 jours d'accès";
    if (months === 12) return "365 jours d'accès";
    return `${months * 30} jours d'accès`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Nos offres</p>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Choisissez votre abonnement</h1>
          <p className="mt-3 text-base text-slate-600">
            Accédez à toutes les éditions du journal avec l'abonnement qui vous convient.
          </p>

          {/* Toggle Individuel/Entreprise */}
          <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            {[
              { key: "INDIVIDUAL", label: "Individuel" },
              { key: "ENTERPRISE", label: "Entreprise" }
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSegment(opt.key as "INDIVIDUAL" | "ENTERPRISE")}
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

          {currentSubscription && (
            <p className="mt-3 text-sm text-emerald-700">
              Vous avez un abonnement actif
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}

        {/* No plans */}
        {!loading && plans.length === 0 && !error && (
          <div className="py-12 text-center text-slate-500">
            Aucun plan disponible pour le moment.
          </div>
        )}

        {/* Plans Grid */}
        {!loading && plans.length > 0 && (
          <div className={`grid gap-6 ${plans.length === 1 ? "md:grid-cols-1 max-w-md mx-auto" : plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {plans.map((plan) => {
              const isCurrent = currentSubscription?.planId === plan.id;
              const isFreeTrial = plan.calculatedPrice === 0;

              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col gap-4 border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                    plan.highlight
                      ? "border-emerald-500 ring-2 ring-emerald-100"
                      : isCurrent
                        ? "border-emerald-400 ring-2 ring-emerald-100"
                        : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{plan.nom}</h2>
                      {plan.description && (
                        <p className="text-sm text-slate-500">{plan.description}</p>
                      )}
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
                      <span className="text-3xl font-bold text-slate-900">
                        {plan.calculatedPrice.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-slate-500">{plan.currency}</span>
                    </div>
                    <p className="text-xs text-slate-500">{getDurationLabel(plan.durationMonths)}</p>
                  </div>

                  {/* Advantages */}
                  {Array.isArray(plan.advantages) && plan.advantages.length > 0 && (
                    <div className="space-y-2">
                      {plan.advantages.map((advantage, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-sm text-slate-700">{advantage}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <ButtonPrimary
                      onClick={() => handleChoosePlan(plan)}
                      disabled={checkoutLoading === plan.id || isCurrent}
                      className={`w-full justify-center ${isCurrent ? "bg-slate-300 text-slate-600 hover:bg-slate-300" : ""}`}
                    >
                      {isCurrent
                        ? "Plan actuel"
                        : checkoutLoading === plan.id
                          ? "Redirection..."
                          : isFreeTrial
                            ? "Commencer l'essai"
                            : "Choisir ce plan"}
                    </ButtonPrimary>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Enterprise CTA */}
        {segment === "INDIVIDUAL" && !loading && (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-900">Compte Entreprise</h3>
            <p className="mt-3 text-slate-600">
              Multi-utilisateurs, accès pour équipes et institutions, support dédié et facturation groupée.
            </p>
            <button
              onClick={() => setSegment("ENTERPRISE")}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Voir les offres Entreprise
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Besoin d'aide ?{" "}
            <a href="mailto:support@journal.com" className="text-emerald-500 underline hover:text-emerald-400">
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
