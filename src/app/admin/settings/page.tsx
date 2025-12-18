"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setError(null);
      try {
        const res = await fetch("/api/admin/settings/registration");
        if (!res.ok) throw new Error("Chargement des paramètres impossible");
        const data = await res.json();
        setEnabled(Boolean(data.enabled));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const toggle = async (next: boolean) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/settings/registration", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next })
      });
      if (!res.ok) throw new Error("Impossible de sauvegarder");
      setEnabled(next);
      setSuccess("Paramètre mis à jour");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configurer les options globales de la plateforme."
      />

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Inscriptions publiques</h3>
            <p className="text-sm text-slate-600">
              Autoriser ou bloquer la création de nouveaux comptes par les utilisateurs.
            </p>
          </div>
          <button
            disabled={loading || saving}
            onClick={() => toggle(!enabled)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
              enabled ? "bg-emerald-500" : "bg-slate-300"
            } ${saving ? "opacity-70" : ""}`}
            aria-pressed={enabled}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                enabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {enabled ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            Les inscriptions sont actuellement ouvertes.
          </p>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Les inscriptions sont désactivées. Les nouveaux visiteurs verront un message bloquant sur la page d’inscription.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}
      </Card>
    </div>
  );
}
