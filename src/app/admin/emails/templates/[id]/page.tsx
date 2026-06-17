"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { AVAILABLE_TOKENS } from "@/modules/emails/tokens";

type Template = {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  category: string;
  sujet: string;
  corps: string;
  corpsText: string | null;
  locale: string;
  status: string;
  layoutId: string | null;
  tokens: any;
  layout: { id: string; nom: string } | null;
  versions: { id: string; version: number; createdAt: string }[];
  _count: { sends: number };
};

const CATEGORIES = [
  { value: "TRANSACTIONAL", label: "Transactionnel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "NOTIFICATION", label: "Notification" },
  { value: "SYSTEM", label: "Système" }
];

const STATUSES = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "PUBLISHED", label: "Publié" },
  { value: "ARCHIVED", label: "Archivé" }
];

export default function EditEmailTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      const res = await fetch(`/api/admin/emails/templates/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTemplate(json.template);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get("nom"),
      description: formData.get("description") || null,
      category: formData.get("category"),
      status: formData.get("status"),
      sujet: formData.get("sujet"),
      corps: formData.get("corps"),
      corpsText: formData.get("corpsText") || null
    };

    try {
      const res = await fetch(`/api/admin/emails/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTemplate(json.template);
      setSuccess("Modèle enregistré avec succès");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      const res = await fetch(`/api/admin/emails/templates/${id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPreviewHtml(json.html);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/emails/templates/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(`Email de test envoyé à ${testEmail}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-red-600">{error || "Template non trouvé"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/emails/templates" className="text-sm text-emerald-600 hover:text-emerald-700">
              ← Retour aux modèles
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{template.nom}</h1>
            <p className="text-sm text-slate-500">{template.slug}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Aperçu
            </button>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    name="nom"
                    defaultValue={template.nom}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Statut</label>
                  <select
                    name="status"
                    defaultValue={template.status}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <input
                  name="description"
                  defaultValue={template.description || ""}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Catégorie</label>
                <select
                  name="category"
                  defaultValue={template.category}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Sujet</label>
                <input
                  name="sujet"
                  defaultValue={template.sujet}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Corps (HTML/MJML)</label>
                <textarea
                  name="corps"
                  defaultValue={template.corps}
                  required
                  rows={16}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Version texte</label>
                <textarea
                  name="corpsText"
                  defaultValue={template.corpsText || ""}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end border-t pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {/* Test envoi */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900">Envoyer un test</h3>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={handleSendTest}
                  disabled={sendingTest || !testEmail}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {sendingTest ? "..." : "Envoyer"}
                </button>
              </div>
            </div>

            {/* Tokens disponibles */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900">Tokens disponibles</h3>
              <div className="mt-3 space-y-3 text-xs">
                {Object.entries(AVAILABLE_TOKENS).map(([category, tokens]) => (
                  <div key={category}>
                    <div className="font-semibold text-slate-700 capitalize">{category}</div>
                    <div className="mt-1 space-y-1">
                      {Object.entries(tokens).map(([token, description]) => (
                        <div key={token} className="flex justify-between text-slate-600">
                          <code className="text-emerald-600">{`{{${token}}}`}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-900">Statistiques</h3>
              <div className="mt-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Emails envoyés</span>
                  <span className="font-semibold">{template._count.sends}</span>
                </div>
                <div className="flex justify-between">
                  <span>Versions</span>
                  <span className="font-semibold">{template.versions.length}</span>
                </div>
              </div>
            </div>

            {/* Historique versions */}
            {template.versions.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-slate-900">Historique</h3>
                <div className="mt-3 space-y-2 text-xs">
                  {template.versions.slice(0, 5).map((v) => (
                    <div key={v.id} className="flex justify-between text-slate-600">
                      <span>Version {v.version}</span>
                      <span>{new Date(v.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal aperçu */}
        {previewHtml && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h3 className="font-semibold text-slate-900">Aperçu de l'email</h3>
                <button
                  onClick={() => setPreviewHtml(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <iframe
                  srcDoc={previewHtml}
                  className="h-[600px] w-full rounded border"
                  title="Aperçu email"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
