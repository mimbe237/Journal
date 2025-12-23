"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { EditionCard } from "@/modules/editions/components/EditionCard";
import { EditionCardSkeleton } from "@/modules/editions/components/EditionCardSkeleton";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { PageHeader } from "@/components/ui/PageHeader";

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

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<EditionListItem[]>([]);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setEditions([]);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/editions?query=${encodeURIComponent(query)}&page=1&pageSize=50`, {
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
          const message = json?.error || raw || "Impossible de charger les résultats";
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
  }, [query]);

  if (!query) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Veuillez saisir un terme de recherche.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EditionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <p className="text-slate-600 dark:text-slate-400">
        {editions.length} résultat{editions.length > 1 ? "s" : ""} pour "{query}"
      </p>
      
      {editions.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {editions.map((edition) => (
            <EditionCard key={edition.id} {...edition} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">Aucun résultat trouvé pour "{query}".</p>
          <Link href="/editions" className="text-emerald-600 hover:underline mt-2 inline-block">
            Voir toutes les éditions
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <PageHeader
          title="Résultats de recherche"
          subtitle="Trouvez les éditions qui vous intéressent"
        />
        <Suspense fallback={<LoadingState message="Chargement..." />}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
