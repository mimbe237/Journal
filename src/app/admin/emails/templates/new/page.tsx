"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { value: "TRANSACTIONAL", label: "Transactionnel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "NOTIFICATION", label: "Notification" },
  { value: "SYSTEM", label: "Système" }
];

const LOCALES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" }
];

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      slug: formData.get("slug"),
      nom: formData.get("nom"),
      description: formData.get("description") || null,
      category: formData.get("category"),
      locale: formData.get("locale"),
      sujet: formData.get("sujet"),
      corps: formData.get("corps"),
      corpsText: formData.get("corpsText") || null
    };

    try {
      const res = await fetch("/api/admin/emails/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur création");
      router.push(`/admin/emails/templates/${json.template.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
          <h1 className="text-3xl font-bold text-slate-900">Nouveau modèle d'email</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Slug (identifiant unique)</label>
              <input
                name="slug"
                required
                pattern="[a-z0-9\-]+"
                placeholder="ex: bienvenue-utilisateur"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <p className="mt-1 text-xs text-slate-500">Lettres minuscules, chiffres et tirets uniquement</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nom du modèle</label>
              <input
                name="nom"
                required
                placeholder="ex: Email de bienvenue"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (optionnelle)</label>
            <input
              name="description"
              placeholder="Brève description de l'usage de ce modèle"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
              <select
                name="category"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Langue</label>
              <select
                name="locale"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {LOCALES.map((loc) => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sujet de l'email</label>
            <input
              name="sujet"
              required
              placeholder="ex: Bienvenue sur Journal, {{user.nom}} !"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-500">Utilisez {"{{token}}"} pour les variables dynamiques</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Corps de l'email (HTML ou MJML)</label>
            <textarea
              name="corps"
              required
              rows={12}
              placeholder="<mjml>...</mjml> ou HTML standard"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Version texte (optionnelle)</label>
            <textarea
              name="corpsText"
              rows={4}
              placeholder="Version texte brut pour les clients email qui ne supportent pas HTML"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Création..." : "Créer le modèle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
