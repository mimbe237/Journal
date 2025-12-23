"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";
import { SubscriptionActions } from "@/components/subscriptions/SubscriptionActions";
import { ResumeReadingCard } from "@/components/dashboard/ResumeReadingCard";
import { ReadingStats } from "@/components/dashboard/ReadingStats";

import { InterestsModal } from "@/components/onboarding/InterestsModal";

type User = {
  id: string;
  nom: string;
  email: string;
  role: string;
  interests?: string[];
};

type Subscription = {
  id: string;
  type: string;
  status: string;
  dateDebut: string;
  dateFin: string;
};

type ReadingSession = {
  id: string;
  editionId: string;
  editionTitle: string;
  editionDate: string;
  editionType: string;
  coverImage?: string | null;
  currentPage: number;
  totalPages: number;
  lastReadAt: string;
};

type Stats = {
  totalBooksRead: number;
  totalPagesRead: number;
  readingStreak: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [lastSession, setLastSession] = useState<ReadingSession | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInterestsModal, setShowInterestsModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        
        if (!userRes.ok) {
          router.push("/auth/login");
          return;
        }

        const userData = await userRes.json();
        setUser(userData.user);

        const isStaff = ["SUPER_ADMIN", "FACTURATION", "SUPPORT"].includes(userData.user?.role);
        
        // Parallel fetch for subscription, reading sessions, and interests
        const promises: Promise<any>[] = [];
        
        if (!isStaff) {
          promises.push(
            fetch("/api/subscriptions/active", { credentials: "include", cache: "no-store" })
              .then(res => res.ok ? res.json() : null)
          );
        } else {
          promises.push(Promise.resolve(null));
        }

        promises.push(
          fetch("/api/reading-sessions?limit=1&stats=true", { credentials: "include", cache: "no-store" })
            .then(res => res.ok ? res.json() : null)
        );

        // Fetch interests separately to be sure
        promises.push(
          fetch("/api/profile/interests", { credentials: "include", cache: "no-store" })
            .then(res => res.ok ? res.json() : { interests: [] })
        );

        const [subData, sessionData, interestsData] = await Promise.all(promises);

        if (subData?.subscription) {
          setSubscription(subData.subscription);
        }

        if (sessionData) {
          if (sessionData.data && sessionData.data.length > 0) {
            setLastSession(sessionData.data[0]);
          }
          if (sessionData.stats) {
            setStats(sessionData.stats);
          }
        }

        // Update user with fetched interests
        if (interestsData?.interests) {
          setUser(prev => prev ? { ...prev, interests: interestsData.interests } : null);
          // Show modal if no interests set (Onboarding)
          if (interestsData.interests.length === 0 && !isStaff) {
            setShowInterestsModal(true);
          }
        }

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <LoadingState message="Chargement de votre espace..." />
        </div>
      </div>
    );
  }

  const subscriptionStatus = subscription?.status;
  const statusLabel = subscription ? subscriptionStatus || "Inconnu" : "Aucun abonnement";
  const statusClass = subscriptionStatus === "ACTIF"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
    : subscriptionStatus === "EXPIRE"
      ? "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
      : "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
  const subscriptionType = subscription?.type || (subscription ? "-" : "Aucun");
  const endDate = subscription?.dateFin
    ? new Date(subscription.dateFin).toLocaleDateString("fr-FR")
    : "-";
  const isAdmin = ["SUPER_ADMIN", "FACTURATION", "SUPPORT"].includes(user?.role ?? "");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8">
        <PageHeader
          title={`Bienvenue, ${user?.nom || "Utilisateur"}`}
          subtitle="Retrouvez vos lectures et gérez votre compte."
        />

        {/* Cockpit de lecture */}
        <div className="space-y-6">
          {lastSession && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Reprendre ma lecture</h2>
              <ResumeReadingCard session={lastSession} />
            </section>
          )}

          {stats && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Mes habitudes</h2>
              <ReadingStats {...stats} />
            </section>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mon profil</h2>
              <Link href="/profile" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Modifier
              </Link>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Nom</span>
                <span className="font-medium text-slate-900 dark:text-white">{user?.nom}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <span className="font-medium text-slate-900 dark:text-white">{user?.email}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Rôle</span>
                <span className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {user?.role}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowInterestsModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <span>🎯</span>
                  <span>Gérer mes centres d'intérêt</span>
                </button>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mon abonnement</h2>
              {!isAdmin && (
                <Link href="/subscriptions" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  Gérer
                </Link>
              )}
            </div>
            {isAdmin ? (
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Les administrateurs n'ont pas d'abonnement associé. Accédez plutôt à l'espace
                d'administration.
              </div>
            ) : (
              <>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Type</span>
                    <span className="font-medium text-slate-900 dark:text-white">{subscriptionType}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Statut</span>
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500 dark:text-slate-400">Date de fin</span>
                    <span className="font-medium text-slate-900 dark:text-white">{endDate}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <SubscriptionActions hasActiveSubscription={!!subscription && subscription.status === 'ACTIF'} />
                </div>
              </>
            )}
          </Card>
        </div>

        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Accès rapide</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Link
              href="/editions"
              className="group flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center transition hover:border-emerald-500 hover:shadow-md dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📰</div>
              <div className="font-medium text-slate-900 dark:text-white">Kiosque</div>
            </Link>
            {!isAdmin && (
              <Link
                href="/subscriptions"
                className="group flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center transition hover:border-emerald-500 hover:shadow-md dark:bg-slate-800 dark:border-slate-700"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💳</div>
                <div className="font-medium text-slate-900 dark:text-white">Abonnement</div>
              </Link>
            )}
            <Link
              href="/profile"
              className="group flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center transition hover:border-emerald-500 hover:shadow-md dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👤</div>
              <div className="font-medium text-slate-900 dark:text-white">Profil</div>
            </Link>
            <Link
              href="/profile/security"
              className="group flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center transition hover:border-emerald-500 hover:shadow-md dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🛡️</div>
              <div className="font-medium text-slate-900 dark:text-white">Sécurité</div>
            </Link>
          </div>
        </Card>
      </div>

      <InterestsModal
        isOpen={showInterestsModal}
        onClose={() => setShowInterestsModal(false)}
        initialInterests={user?.interests || []}
        onSave={(newInterests) => {
          setUser(prev => prev ? { ...prev, interests: newInterests } : null);
        }}
      />
    </div>
  );
}
