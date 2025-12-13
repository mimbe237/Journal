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
      setSuccess("Connexion réussie");
      // Redirect to dashboard after successful login
      setTimeout(() => window.location.href = "/dashboard", 1000);
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
            <h1 className="text-4xl font-bold md:text-5xl">Connexion à votre compte</h1>
            <p className="max-w-xl text-slate-200">
              Accédez à vos éditions et gérez votre abonnement en toute sécurité. Une expérience fluide et adaptée à tous
              vos appareils.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <Badge>Lecture sécurisée</Badge>
              <Badge>Cookies httpOnly</Badge>
              <Badge>Accès multi-plateforme</Badge>
            </div>
          </div>

          <Card className="space-y-6 bg-white/90 shadow-xl">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Se connecter</h2>
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
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-emerald-600">{success}</p>}

              <ButtonPrimary type="submit" disabled={loading} className="w-full">
                {loading ? "Connexion..." : "Se connecter"}
              </ButtonPrimary>
            </form>

            <p className="text-sm text-slate-600">
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-200 ring-1 ring-emerald-500/30">
      {children}
    </span>
  );
}
