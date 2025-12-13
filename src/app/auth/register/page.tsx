"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/FormControls";

export default function RegisterPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [accountType, setAccountType] = useState<"individual" | "enterprise">("individual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const role = accountType === "enterprise" ? "COMPTE_ENTREPRISE" : "ABONNE";
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, motDePasse, role })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Inscription impossible");
      setSuccess("Compte créé. Vous pouvez maintenant vous connecter.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 md:px-8">
        <div className="grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Espace abonné</p>
            <h1 className="text-4xl font-bold md:text-5xl">Créer votre compte</h1>
            <p className="max-w-xl text-slate-200">
              Rejoignez le journal numérique et accédez à toutes les éditions. Gestion sécurisée via cookies httpOnly,
              adaptée aux abonnés individuels et comptes entreprises.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <Badge>Abonnement flexible</Badge>
              <Badge>Promo codes</Badge>
              <Badge>Accès B2B</Badge>
            </div>
          </div>

          <Card className="space-y-6 bg-white/90 shadow-xl">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Créer un compte</h2>
              <p className="text-sm text-slate-600">Renseignez vos informations pour démarrer.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Votre nom complet"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
                <p className="text-xs text-slate-500">Au moins 8 caractères.</p>
              </div>

              <div className="space-y-2">
                <Label>Type de compte</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setAccountType("individual")}
                    className={`rounded-lg border px-3 py-2 font-semibold transition ${
                      accountType === "individual"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                    }`}
                  >
                    Individuel
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("enterprise")}
                    className={`rounded-lg border px-3 py-2 font-semibold transition ${
                      accountType === "enterprise"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                    }`}
                  >
                    Entreprise
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  L’admin peut ajuster ce type plus tard si besoin.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <ButtonPrimary type="submit" disabled={loading} className="w-full">
                {loading ? "Création..." : "Créer le compte"}
              </ButtonPrimary>
            </form>

            <p className="text-sm text-slate-600">
              Déjà inscrit ?{" "}
              <Link href="/auth/login" className="font-semibold text-emerald-600 underline-offset-4 hover:underline">
                Se connecter
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
      {children}
    </span>
  );
}
