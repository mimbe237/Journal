"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

interface PricingSectionProps {
  variant?: "light" | "dark";
  showToggle?: boolean;
  defaultAudience?: "INDIVIDUAL" | "ENTERPRISE";
  onSelectPlan?: (plan: PublicPlan) => void;
  currentPlanId?: string | null;
  loading?: boolean;
}

export function PricingSection({
  variant = "dark",
  showToggle = true,
  defaultAudience = "INDIVIDUAL",
  onSelectPlan,
  currentPlanId,
  loading: externalLoading
}: PricingSectionProps) {
  const [segment, setSegment] = useState<"INDIVIDUAL" | "ENTERPRISE">(defaultAudience);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
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
    }
    fetchPlans();
  }, [segment]);

  const isDark = variant === "dark";
  const isLoading = loading || externalLoading;

  return (
    <div className={isDark ? "bg-slate-900 py-20 text-white" : "py-12"}>
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className={`text-xs uppercase tracking-[0.3em] ${isDark ? "text-emerald-300" : "text-emerald-600"}`}>
            Nos offres
          </p>
          <h2 className={`text-3xl font-bold md:text-4xl ${isDark ? "text-white" : "text-slate-900"}`}>
            Choisissez votre abonnement
          </h2>
          <p className={`mt-3 text-base ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            Accédez à toutes les éditions du journal avec l'abonnement qui vous convient.
          </p>

          {/* Toggle Individuel/Entreprise */}
          {showToggle && (
            <div className={`mt-4 inline-flex rounded-full border p-1 shadow-sm ${
              isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
            }`}>
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
                      : isDark
                        ? "text-slate-300 hover:text-white"
                        : "text-slate-600 hover:text-emerald-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        )}

        {/* Plans Grid */}
        {!isLoading && plans.length === 0 && !error && (
          <div className={`py-12 text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Aucun plan disponible pour le moment.
          </div>
        )}

        {!isLoading && plans.length > 0 && (
          <div className={`grid gap-6 ${plans.length === 1 ? "md:grid-cols-1 max-w-md mx-auto" : plans.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                variant={variant}
                isCurrent={currentPlanId === plan.id}
                onSelect={onSelectPlan}
              />
            ))}
          </div>
        )}

        {/* Entreprise CTA (only for individual segment) */}
        {segment === "INDIVIDUAL" && !isLoading && (
          <div className={`mt-10 rounded-2xl p-8 text-center ${
            isDark ? "border border-slate-800 bg-slate-800/70" : "border border-slate-200 bg-slate-50"
          }`}>
            <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              Compte Entreprise
            </h3>
            <p className={`mt-3 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Multi-utilisateurs, accès pour équipes et institutions, support dédié et facturation groupée.
            </p>
            <button
              onClick={() => setSegment("ENTERPRISE")}
              className={`mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition ${
                isDark
                  ? "bg-white text-slate-900 hover:bg-slate-100"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              Voir les offres Entreprise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: PublicPlan;
  variant: "light" | "dark";
  isCurrent: boolean;
  onSelect?: (plan: PublicPlan) => void;
}

function PlanCard({ plan, variant, isCurrent, onSelect }: PlanCardProps) {
  const isDark = variant === "dark";
  const isHighlight = plan.highlight;
  
  // Format price
  const formatPrice = (price: number) => {
    return price.toLocaleString("fr-FR");
  };

  // Duration label
  const getDurationLabel = (months: number) => {
    if (months === 1) return "30 jours d'accès";
    if (months === 12) return "365 jours d'accès";
    return `${months} mois d'accès`;
  };

  // Period suffix
  const getPeriodSuffix = (months: number) => {
    if (months === 1) return "/mois";
    if (months === 12) return "/an";
    return `/${months} mois`;
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(plan);
    }
  };

  // Determine if this is a free trial
  const isFreeTrial = plan.basePrice === 0;

  // Card styling based on variant and highlight
  const cardClasses = isDark
    ? isHighlight
      ? "border-emerald-300 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-2xl shadow-emerald-900/30"
      : "border border-slate-800 bg-slate-800/60 text-white"
    : isHighlight
      ? "border-2 border-emerald-500 bg-white shadow-xl ring-2 ring-emerald-100"
      : isCurrent
        ? "border-2 border-emerald-400 bg-white shadow-lg ring-2 ring-emerald-100"
        : "border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-md";

  return (
    <div className={`relative flex flex-col gap-4 rounded-2xl p-8 transition ${cardClasses}`}>
      {/* Badge */}
      {(plan.badge || isCurrent) && (
        <span
          className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            isCurrent
              ? "bg-emerald-100 text-emerald-700"
              : isDark
                ? "bg-white/20 text-white"
                : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {isCurrent ? "Plan actuel" : plan.badge}
        </span>
      )}

      {/* Title & Description */}
      <div>
        <h3 className={`text-xl font-semibold ${
          isDark ? "text-white" : "text-slate-900"
        }`}>
          {plan.nom}
        </h3>
        {plan.description && (
          <p className={`mt-1 text-sm ${
            isDark
              ? isHighlight ? "text-emerald-100" : "text-slate-300"
              : "text-slate-500"
          }`}>
            {plan.description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${
            isDark ? "text-white" : "text-slate-900"
          }`}>
            {formatPrice(plan.calculatedPrice)}
          </span>
          <span className={isDark
            ? isHighlight ? "text-emerald-100" : "text-slate-300"
            : "text-slate-500"
          }>
            {plan.currency}
          </span>
        </div>
        <p className={`text-xs ${
          isDark
            ? isHighlight ? "text-emerald-100" : "text-slate-400"
            : "text-slate-500"
        }`}>
          {getDurationLabel(plan.durationMonths)}
        </p>
      </div>

      {/* Advantages */}
      {Array.isArray(plan.advantages) && plan.advantages.length > 0 && (
        <ul className="space-y-2">
          {plan.advantages.map((advantage, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                isDark
                  ? isHighlight ? "bg-emerald-100" : "bg-emerald-400"
                  : "bg-emerald-500"
              }`} />
              <span className={
                isDark
                  ? isHighlight ? "text-emerald-50" : "text-slate-200"
                  : "text-slate-700"
              }>
                {advantage}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA Button */}
      <div className="mt-auto pt-4">
        {onSelect ? (
          <button
            onClick={handleClick}
            disabled={isCurrent}
            className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
              isCurrent
                ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                : isDark
                  ? isHighlight
                    ? "bg-white text-emerald-700 hover:bg-emerald-50"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isCurrent
              ? "Plan actuel"
              : isFreeTrial
                ? "Commencer l'essai"
                : "Choisir ce plan"}
          </button>
        ) : (
          <Link
            href={`/subscriptions?plan=${plan.slug}`}
            className={`block w-full rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
              isDark
                ? isHighlight
                  ? "bg-white text-emerald-700 hover:bg-emerald-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {isFreeTrial ? "Commencer l'essai" : "Choisir ce plan"}
          </Link>
        )}
      </div>
    </div>
  );
}

export type { PublicPlan };
