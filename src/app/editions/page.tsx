"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { EditionCard } from "@/modules/editions/components/EditionCard";
import { LoadingState, ErrorState } from "@/components/ui/States";

type EditionListItem = {
  id: string;
  titre: string;
  datePublication: string;
  type: string;
  nombrePages: number | null;
  cheminImageUne?: string | null;
  prix?: number | null;
  devise?: string | null;
  access?: {
    status: "read" | "buy_or_subscribe" | "subscribe";
    detail?: string | null;
    coverage?: {
      type: "individual" | "enterprise";
      dateDebut: string;
      dateFin: string;
    } | null;
  };
};

const typeOptions = [
  { value: "all", label: "Tous" },
  { value: "QUOTIDIEN", label: "Quotidien" },
  { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
  { value: "HORS_SERIE", label: "Hors-série" },
  { value: "SPECIAL", label: "Spécial" }
];

export default function EditionsKioskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<EditionListItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/editions?page=1&pageSize=30", {
          cache: "no-store",
          credentials: "include"
        });
        const raw = await res.text();
        let json: any = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          // ignore non-JSON
        }
        if (!res.ok) {
          const message = json?.error || raw || "Impossible de charger les éditions";
          throw new Error(message);
        }
        if (cancelled) return;
        setEditions(json?.data ?? []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return editions.filter((e) => {
      const matchType = typeFilter === "all" || e.type === typeFilter;
      const q = query.toLowerCase().trim();
      const matchQuery =
        !q ||
        e.titre.toLowerCase().includes(q) ||
        new Date(e.datePublication).toLocaleDateString("fr-FR").includes(q);
      return matchType && matchQuery;
    });
  }, [editions, typeFilter, query]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden pb-12 pt-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-slate-50" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-700">Kiosque numérique</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Dernières éditions</h1>
              <p className="text-slate-600">Consultez les publications récentes, achetez à l’unité ou abonnez-vous.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/subscriptions"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Voir les formules
              </Link>
              <Link
                href="/archives"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-emerald-300 hover:text-emerald-700"
              >
                Accéder aux archives
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    typeFilter === opt.value
                      ? "bg-emerald-500 text-emerald-950 shadow-sm"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="md:ml-auto w-full md:w-72">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une édition..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          {loading && <LoadingState message="Chargement des éditions..." />}
          {error && <ErrorState message={error} />}

          {!loading && !error && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((edition) => (
                <EditionCard key={edition.id} {...edition} />
              ))}
              {filtered.length === 0 && <ErrorState message="Aucune édition disponible pour le moment." />}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
