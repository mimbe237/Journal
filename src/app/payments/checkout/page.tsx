"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Edition = {
  id: string;
  titre: string;
  datePublication: string;
  nombrePages: number | null;
  cheminImageUne: string | null;
};

// Prix en FCFA
const SINGLE_EDITION_PRICE = 500;
const MONTHLY_SUBSCRIPTION_PRICE = 2500;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const editionId = searchParams.get("edition");
  const type = searchParams.get("type") || "single"; // "single" ou "subscription"
  
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"single" | "monthly">(
    type === "subscription" ? "monthly" : "single"
  );

  useEffect(() => {
    async function loadEdition() {
      if (!editionId) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/editions/public?page=1&pageSize=50`);
        if (res.ok) {
          const data = await res.json();
          const found = data.data.find((e: Edition) => e.id === editionId);
          if (found) {
            setEdition(found);
          }
        }
      } catch (err) {
        console.error("Erreur chargement édition:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEdition();
  }, [editionId]);

  async function handlePayment() {
    setProcessing(true);
    setError(null);

    try {
      const payload = selectedPlan === "single" 
        ? {
            subscriptionType: "MENSUEL", // On utilise MENSUEL mais avec durée courte pour achat unique
            amount: SINGLE_EDITION_PRICE,
            currency: "XAF",
            durationDays: 365 * 10, // Accès permanent (10 ans)
            editionId // Pour référence
          }
        : {
            subscriptionType: "MENSUEL",
            amount: MONTHLY_SUBSCRIPTION_PRICE,
            currency: "XAF",
            durationDays: 30
          };

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          // Rediriger vers la connexion
          router.push(`/auth/login?redirect=/payments/checkout?edition=${editionId}&type=${selectedPlan}`);
          return;
        }
        throw new Error(json?.error || "Erreur lors du paiement");
      }

      // Rediriger vers la page de paiement
      window.location.href = json.checkoutUrl;
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue");
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm text-emerald-600 hover:underline mb-4 inline-block">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Finaliser votre achat</h1>
          <p className="mt-2 text-slate-600">
            Choisissez votre option et procédez au paiement sécurisé
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* Résumé de l'édition */}
          {edition && (
            <Card className="bg-white border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Édition sélectionnée</h2>
              <div className="flex gap-4">
                <div className="w-24 aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {edition.cheminImageUne ? (
                    <img
                      src={`/api/files/${edition.cheminImageUne}`}
                      alt={edition.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      Pas d'image
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{edition.titre}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
                      new Date(edition.datePublication)
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {edition.nombrePages || 0} pages
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Options de paiement */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Choisissez votre formule</h2>
            
            {/* Option: Achat unique */}
            {edition && (
              <button
                onClick={() => setSelectedPlan("single")}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === "single"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPlan === "single" ? "border-emerald-500" : "border-slate-300"
                      }`}>
                        {selectedPlan === "single" && (
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-900">Cette édition uniquement</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-7">
                      Accès permanent à ce numéro
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{SINGLE_EDITION_PRICE} FCFA</p>
                    <p className="text-xs text-slate-400">Paiement unique</p>
                  </div>
                </div>
              </button>
            )}

            {/* Option: Abonnement mensuel */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                selectedPlan === "monthly"
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-bl-lg font-medium">
                Recommandé
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === "monthly" ? "border-emerald-500" : "border-slate-300"
                    }`}>
                      {selectedPlan === "monthly" && (
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <span className="font-semibold text-slate-900">Abonnement mensuel</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 ml-7">
                    Toutes les éditions en illimité
                  </p>
                  <ul className="mt-2 ml-7 space-y-1">
                    <li className="text-xs text-slate-600 flex items-center gap-1">
                      <span className="text-emerald-500">✓</span> Accès à toutes les éditions
                    </li>
                    <li className="text-xs text-slate-600 flex items-center gap-1">
                      <span className="text-emerald-500">✓</span> Nouvelles parutions incluses
                    </li>
                    <li className="text-xs text-slate-600 flex items-center gap-1">
                      <span className="text-emerald-500">✓</span> Annulation à tout moment
                    </li>
                  </ul>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{MONTHLY_SUBSCRIPTION_PRICE} FCFA</p>
                  <p className="text-xs text-slate-400">/mois</p>
                </div>
              </div>
            </button>

            {/* Récapitulatif */}
            <div className="bg-slate-100 rounded-xl p-4 mt-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Sous-total</span>
                <span className="text-slate-900">
                  {selectedPlan === "single" ? SINGLE_EDITION_PRICE : MONTHLY_SUBSCRIPTION_PRICE} FCFA
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="font-bold text-emerald-600">
                  {selectedPlan === "single" ? SINGLE_EDITION_PRICE : MONTHLY_SUBSCRIPTION_PRICE} FCFA
                </span>
              </div>
            </div>

            {/* Bouton de paiement */}
            <ButtonPrimary
              onClick={handlePayment}
              disabled={processing}
              className="w-full justify-center py-4 text-base"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Traitement...
                </span>
              ) : (
                `Payer ${selectedPlan === "single" ? SINGLE_EDITION_PRICE : MONTHLY_SUBSCRIPTION_PRICE} FCFA`
              )}
            </ButtonPrimary>

            {/* Sécurité */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Paiement sécurisé via Mobile Money
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
