"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary } from "@/components/ui/Button";

type Edition = {
  id: string;
  titre: string;
  datePublication: string;
  type: string;
  nombrePages: number | null;
  cheminImageUne: string | null;
  journalTypeId?: string | null;
  deletedAt?: string | null;
  guestUrl?: string | null;
};

export default function EditionsListPage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchEditions();
  }, []);

  async function fetchEditions() {
    try {
      // withGuestLinks : garantit qu'un lien de lecture invité existe pour
      // chaque édition affichée et le retourne dans `guestUrl`.
      const res = await fetch("/api/admin/editions?withGuestLinks=true");
      if (res.ok) {
        const data = await res.json();
        setEditions(data.editions || []);
      }
    } catch (err) {
      console.error("Erreur chargement éditions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(edition: Edition) {
    if (!edition.guestUrl) return;
    try {
      await navigator.clipboard.writeText(edition.guestUrl);
      setCopiedId(edition.id);
      setTimeout(() => setCopiedId((prev) => (prev === edition.id ? null : prev)), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gérer les éditions</h1>
            <p className="mt-2 text-slate-600">Chaque édition et son lien de lecture invité</p>
          </div>
          <Link href="/admin/editions">
            <ButtonPrimary>+ Nouvelle édition</ButtonPrimary>
          </Link>
        </div>

        {loading ? (
          <Card className="bg-white p-8 text-center text-slate-500">
            Chargement...
          </Card>
        ) : editions.length === 0 ? (
          <Card className="bg-white p-8 text-center text-slate-500">
            Aucune édition trouvée
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {editions.map((edition) => (
              <Card key={edition.id} className="bg-white p-4 hover:shadow-lg transition">
                <div className="space-y-3">
                  {/* Image de Une */}
                  <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-700">
                    {edition.cheminImageUne ? (
                      <img
                        src={`/api/files/${edition.cheminImageUne}`}
                        alt={edition.titre}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='267'%3E%3Crect fill='%23475569' width='200' height='267'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23cbd5e1' font-size='16'%3EPas de une%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                        Pas d'image
                      </div>
                    )}
                  </div>

                  {/* Lien de lecture invité */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Lien invité
                    </p>
                    {edition.guestUrl ? (
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={edition.guestUrl}
                          onFocus={(e) => e.currentTarget.select()}
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-600"
                        />
                        <button
                          onClick={() => copyLink(edition)}
                          title="Copier le lien"
                          className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                        >
                          {copiedId === edition.id ? (
                            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                        <a
                          href={edition.guestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir le lien"
                          className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">—</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
