"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LatestEdition = {
  id: string;
  titre: string;
  datePublication: string;
  nombrePages: number | null;
  cheminImageUne: string | null;
};

type User = {
  id: string;
  nom: string;
  hasActiveSubscription?: boolean;
} | null;

export function LatestEditionShowcase() {
  const [edition, setEdition] = useState<LatestEdition | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>(null);
  const [copied, setCopied] = useState(false);

  const shareEdition = async () => {
    if (!edition) return;
    
    const shareUrl = `${window.location.origin}/editions/${edition.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur copie lien:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        // Charger l'utilisateur courant
        const userRes = await fetch("/api/auth/me", { credentials: "include" });
        if (userRes.ok) {
          const userData = await userRes.json();
          // Vérifier si l'utilisateur a un abonnement actif
          const subRes = await fetch("/api/subscriptions/active", { credentials: "include" });
          const hasActiveSubscription = subRes.ok;
          setUser({ ...userData, hasActiveSubscription });
        }

        // Charger la dernière édition (API publique)
        const res = await fetch("/api/editions/public?page=1&pageSize=1");
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.length > 0) {
            setEdition(data.data[0]);
          }
        }
      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-emerald-300/20 blur-3xl" />
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl p-8 text-center text-slate-400">
          Chargement de la dernière édition...
        </div>
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-emerald-300/20 blur-3xl" />
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl p-8 text-center text-slate-400">
          Aucune édition disponible
        </div>
      </div>
    );
  }

  const editionDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(edition.datePublication)
  );

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-blue-500/10 to-emerald-300/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Lecteur en direct</p>
            <p className="text-lg font-semibold text-slate-900">{edition.titre}</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Dernière
          </span>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Top row : couverture + statut (même largeur) */}
          <div className="grid items-start gap-6 md:grid-cols-2">
            {/* Image de Une */}
            <div className="flex flex-col items-center gap-3">
              <div className="aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-xl bg-slate-100 shadow-lg">
                {edition.cheminImageUne ? (
                  <img
                    src={`/api/files/${edition.cheminImageUne}`}
                    alt={edition.titre}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23e2e8f0' width='300' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-size='16'%3EPas de couverture%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    Pas de couverture
                  </div>
                )}
              </div>
              <div className="text-center text-sm text-slate-500">
                <p className="font-medium text-slate-900">{edition.nombrePages || 0} pages</p>
                <p className="text-xs">{editionDate}</p>
              </div>
            </div>

            {/* Carte statut */}
            {user?.hasActiveSubscription ? (
              <div className="rounded-2xl bg-slate-900 p-6 text-slate-100 shadow-lg shadow-slate-900/30">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-300 font-semibold text-base">Abonné</span>
                    <span className="text-emerald-400 text-lg">✓</span>
                  </div>
                  <p className="text-sm text-slate-300">Accès illimité à toutes les éditions</p>
                </div>
              </div>
            ) : user ? (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-amber-900">Accès limité</span>
                  <span className="text-amber-600 font-semibold">Non abonné</span>
                </div>
                <p className="mt-2 text-sm text-amber-700">
                  Abonnez-vous pour lire cette édition et toutes les autres
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-900">Bienvenue !</span>
                  <span className="text-blue-600 font-semibold">Visiteur</span>
                </div>
                <p className="mt-2 text-sm text-blue-700">Créez un compte pour accéder à nos éditions</p>
              </div>
            )}
          </div>

          {/* Bloc plein largeur : options + USP + CTA */}
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            {user?.hasActiveSubscription ? (
              <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-3">
                <Link
                  href={`/editions/${edition.id}`}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  📖 Lire
                </Link>
                <button
                  onClick={shareEdition}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-medium transition hover:border-emerald-200 hover:text-emerald-700"
                >
                  {copied ? "✓ Copié" : "🔗 Partager"}
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="mb-1 text-sm font-semibold text-slate-900">Choisissez votre accès</p>
                  <p className="text-xs text-slate-500">Lecture immédiate après paiement</p>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <a
                    href={`/payments/checkout?edition=${edition.id}&type=single`}
                    className="flex items-center justify-between rounded-lg border-2 border-slate-200 bg-white px-4 py-3 transition hover:border-emerald-300 hover:shadow-md group"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-700">📰 Cette édition</p>
                      <p className="text-xs text-slate-500">Accès permanent à ce numéro</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">500 FCFA</p>
                      <p className="text-xs text-slate-400">Paiement unique</p>
                    </div>
                  </a>

                  <Link
                    href="/subscriptions/new"
                    className="relative flex items-center justify-between overflow-hidden rounded-lg border-2 border-emerald-200 bg-emerald-50 px-4 py-3 transition hover:border-emerald-400 hover:shadow-md group"
                  >
                    <div className="absolute top-0 right-0 rounded-bl-lg bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                      Recommandé
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-900">🎯 Abonnement mensuel</p>
                      <p className="text-xs text-emerald-700">Toutes les éditions illimitées</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">2 500 FCFA</p>
                      <p className="text-xs text-emerald-500">/mois</p>
                    </div>
                  </Link>
                </div>
              </>
            )}

            <div className="space-y-2 border-t border-slate-200 pt-3 text-sm text-slate-700">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>PDF convertis en images sécurisées</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Lecture fluide sur mobile et desktop</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Paiement sécurisé Mobile Money</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              {user?.hasActiveSubscription ? (
                <Link
                  href={`/editions/${edition.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
                >
                  Lire maintenant
                </Link>
              ) : user ? (
                <Link
                  href="/subscriptions/new"
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
                >
                  S'abonner pour lire
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/register"
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
                  >
                    Créer mon compte
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
