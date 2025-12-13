"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function FakePaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasSession = useMemo(() => Boolean(sessionId), [sessionId]);

  async function confirm(result: "success" | "failure") {
    if (!sessionId) return;
    setStatus("loading");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/payments/fake/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, status: result })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Confirmation impossible");
      setStatus("done");
      setMessage(result === "success" ? "Paiement fictif confirmé" : "Paiement marqué en échec");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setError(err?.message ?? "Erreur inconnue");
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <Card className="w-full space-y-6 bg-white/90 shadow-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Paiement fictif</p>
            <h1 className="text-2xl font-semibold text-slate-900">Simuler le résultat du paiement</h1>
            <p className="text-sm text-slate-600">
              Cette page existe uniquement pour les tests. Choisissez succes ou echec pour finaliser l'abonnement.
            </p>
          </div>

          {!hasSession && <p className="text-sm text-red-600">Aucune session de paiement fournie.</p>}

          {hasSession && (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">Session : {sessionId}</p>
              <div className="flex flex-wrap gap-3">
                <ButtonPrimary disabled={status === "loading"} onClick={() => confirm("success")}>
                  {status === "loading" ? "Confirmation..." : "Simuler un paiement succes"}
                </ButtonPrimary>
                <ButtonSecondary disabled={status === "loading"} onClick={() => confirm("failure")}>
                  {status === "loading" ? "Confirmation..." : "Simuler un echec"}
                </ButtonSecondary>
              </div>
            </div>
          )}

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </Card>
      </div>
    </div>
  );
}
