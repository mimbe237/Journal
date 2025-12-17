"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";
import { SubscriptionActions } from "@/components/subscriptions/SubscriptionActions";

type User = {
  id: string;
  nom: string;
  email: string;
  role: string;
};

type Subscription = {
  id: string;
  type: string;
  status: string;
  dateDebut: string;
  dateFin: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData.user);

          const isStaff = ["SUPER_ADMIN", "FACTURATION", "SUPPORT"].includes(userData.user?.role);
          if (!isStaff) {
            const subRes = await fetch("/api/subscriptions/active", {
              credentials: "include",
              cache: "no-store"
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              setSubscription(subData.subscription);
            }
          } else {
            setSubscription(null);
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <LoadingState message="Chargement de votre espace..." />
        </div>
      </div>
    );
  }

  const subscriptionStatus = subscription?.status;
  const statusLabel = subscription ? subscriptionStatus || "Inconnu" : "Aucun abonnement";
  const statusClass = subscriptionStatus === "ACTIF"
    ? "bg-emerald-100 text-emerald-700"
    : subscriptionStatus === "EXPIRE"
      ? "bg-slate-100 text-slate-700"
      : "bg-amber-50 text-amber-700";
  const subscriptionType = subscription?.type || (subscription ? "-" : "Aucun");
  const endDate = subscription?.dateFin
    ? new Date(subscription.dateFin).toLocaleDateString("fr-FR")
    : "-";
  const isAdmin = ["SUPER_ADMIN", "FACTURATION", "SUPPORT"].includes(user?.role ?? "");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
        <PageHeader
          title={`Bienvenue, ${user?.nom || "Utilisateur"}`}
          subtitle="Gérez votre profil et votre abonnement."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Mon profil</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Nom:</span> {user?.nom}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p>
                <span className="font-medium">Rôle:</span>{" "}
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">
                  {user?.role}
                </span>
              </p>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Mon abonnement</h2>
            {isAdmin ? (
              <div className="text-sm text-slate-600">
                Les administrateurs n'ont pas d'abonnement associé. Accédez plutôt à l'espace
                d'administration.
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Type:</span> {subscriptionType}
                  </p>
                  <p>
                    <span className="font-medium">Statut:</span>{" "}
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Date de fin:</span> {endDate}
                  </p>
                </div>
                <div className="pt-2">
                  <SubscriptionActions hasActiveSubscription={!!subscription && subscription.status === 'ACTIF'} />
                </div>
              </>
            )}
          </Card>
        </div>

        <Card className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Accès rapide</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/editions"
              className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:border-emerald-600 hover:shadow-md"
            >
              <div className="text-2xl">📰</div>
              <div className="mt-2 font-medium text-slate-900">Éditions</div>
            </Link>
            {!isAdmin && (
              <Link
                href="/subscriptions"
                className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:border-emerald-600 hover:shadow-md"
              >
                <div className="text-2xl">💳</div>
                <div className="mt-2 font-medium text-slate-900">Abonnement</div>
              </Link>
            )}
            <Link
              href="/profile"
              className="rounded-lg border border-slate-200 bg-white p-4 text-center hover:border-emerald-600 hover:shadow-md"
            >
              <div className="text-2xl">⚙️</div>
              <div className="mt-2 font-medium text-slate-900">Paramètres</div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
