"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";

type User = {
  id: string;
  nom: string;
  email: string;
  role: string;
  dateCreation?: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutDone, setLogoutDone] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Impossible de charger le profil");
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleLogout() {
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("La déconnexion a échoué");
      setLogoutDone(true);
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 500);
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <LoadingState message="Chargement de votre profil..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 md:px-8">
        <PageHeader
          title="Mon profil"
          subtitle="Gérez vos informations de compte et vos accès."
          actions={
            <div className="flex gap-2">
              <Link href="/dashboard">
                <ButtonSecondary>Retour dashboard</ButtonSecondary>
              </Link>
              {!["SUPER_ADMIN", "FACTURATION", "SUPPORT"].includes(user?.role ?? "") ? (
                <Link href="/subscriptions">
                  <ButtonSecondary>Mon abonnement</ButtonSecondary>
                </Link>
              ) : null}
              <ButtonPrimary onClick={handleLogout}>Se déconnecter</ButtonPrimary>
            </div>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {logoutDone ? <p className="text-sm text-emerald-600">Déconnexion réussie.</p> : null}

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Informations personnelles</h2>
            <p className="text-sm text-slate-600">Données liées à votre compte.</p>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <InfoRow label="Nom" value={user?.nom} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Rôle" value={user?.role} />
            <InfoRow
              label="Date de création"
              value={
                user?.dateCreation
                  ? new Date(user.dateCreation).toLocaleDateString("fr-FR")
                  : "Non disponible"
              }
            />
            <InfoRow label="Identifiant" value={user?.id} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}
