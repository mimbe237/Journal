"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/FormControls";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
        credentials: "include"
      });
      const raw = await res.text();
      let json: any = null;
      try {
        json = raw ? JSON.parse(raw) : null;
      } catch {
        // Réponse non JSON (ex: page d'erreur HTML)
      }
      if (!res.ok) {
        const message = json?.error || raw || "Connexion impossible";
        throw new Error(message);
      }
      const role: string | undefined = json?.user?.role;
      
      // Check for redirect query param
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get("redirect");
      
      const redirect = redirectParam || getRedirectPathForRole(role);
      setSuccess("Connexion réussie");
      // Redirect to the appropriate dashboard after successful login
      setTimeout(() => {
        window.location.href = redirect;
      }, 500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:py-12 md:px-8">
        <div className="grid w-full gap-6 sm:gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 sm:space-y-4 text-white text-center md:text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Espace abonné</p>
            <h1 className="text-3xl sm:text-4xl font-bold md:text-5xl">Connexion à votre compte</h1>
            <p className="max-w-xl text-sm sm:text-base text-slate-200 mx-auto md:mx-0">
              Accédez à vos éditions et gérez votre abonnement en toute sécurité.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300">
              <Badge>Lecture sécurisée</Badge>
              <Badge>Cookies httpOnly</Badge>
              <Badge>Accès multi-plateforme</Badge>
            </div>
          </div>

          <Card className="space-y-4 sm:space-y-6 bg-white/90 shadow-xl">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Se connecter</h2>
              <p className="text-sm text-slate-600">Identifiez-vous pour continuer vers le kiosque.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@example.com"
                  required
                  className="min-h-[44px]"
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
                  placeholder="••••••••"
                  className="min-h-[44px]"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <ButtonPrimary type="submit" disabled={loading} className="w-full min-h-[48px] text-base">
                {loading ? "Connexion..." : "Se connecter"}
              </ButtonPrimary>
            </form>

            <p className="text-sm text-slate-600 text-center sm:text-left">
              Pas encore de compte ?{" "}
              <Link href="/auth/register" className="font-semibold text-emerald-600 underline-offset-4 hover:underline">
                Créer un compte
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getRedirectPathForRole(role?: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "SUPPORT":
      return "/admin/support";
    case "FACTURATION":
      return "/admin/facturation";
    case "COMPTE_ENTREPRISE":
      return "/enterprise/dashboard";
    default:
      return "/dashboard";
  }
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
      {children}
    </span>
  );
}
