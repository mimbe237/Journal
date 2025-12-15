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

export default function ArchivesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<EditionListItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Charger un lot plus large pour l'archive
        const res = await fetch("/api/editions?page=1&pageSize=60", {
          cache: "no-store",
          credentials: "include"
        });
        const raw = await res.text();
        let json: any = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          // ignore
        }
        if (!res.ok) {
          const message = json?.error || raw || "Impossible de charger les éditions";
          throw new Error(message);
        }
        if (!cancelled) {
          setEditions(json?.data ?? []);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const years = useMemo(() => {
    const set = new Set<string>();
    editions.forEach((e) => set.add(new Date(e.datePublication).getFullYear().toString()));
    return ["all", ...Array.from(set).sort((a, b) => Number(b) - Number(a))];
  }, [editions]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return editions.filter((e) => {
      const year = new Date(e.datePublication).getFullYear().toString();
      const matchYear = yearFilter === "all" || year === yearFilter;
      const matchType = typeFilter === "all" || e.type === typeFilter;
      const matchQuery =
        !q ||
        e.titre.toLowerCase().includes(q) ||
        new Date(e.datePublication).toLocaleDateString("fr-FR").includes(q);
      return matchYear && matchType && matchQuery;
    });
  }, [editions, yearFilter, typeFilter, query]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden pb-12 pt-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-100 via-white to-slate-50" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Archives</p>
              <h1 className="text-3xl font-semibold md:text-4xl">Retrouvez une ancienne édition</h1>
              <p className="text-slate-600">Filtrez par type, année ou recherchez une date/titre. Achat à l’unité ou via abonnement.</p>
            </div>
            <Link
              href="/subscriptions"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Voir les formules d’abonnement
            </Link>
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Année</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y === "all" ? "Toutes" : y}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:ml-auto w-full md:w-72">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Recherche par titre ou date..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          {loading && <LoadingState message="Chargement des archives..." />}
          {error && <ErrorState message={error} />}
          {!loading && !error && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((edition) => (
                <EditionCard key={edition.id} {...edition} />
              ))}
              {filtered.length === 0 && <ErrorState message="Aucune édition trouvée pour ces filtres." />}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
