"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/States";

interface SearchResult {
  id: string;
  titre: string;
  datePublication: string;
  cheminImageUne: string | null;
  headlines: { title: string; page: number; category?: string }[] | null;
  tags: string[];
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    async function fetchResults() {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query]);

  if (!query) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Veuillez saisir un terme de recherche.
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Recherche dans les archives..." />;
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-600 dark:text-slate-400">
        {results.length} résultat{results.length > 1 ? "s" : ""} pour "{query}"
      </p>

      {results.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((edition) => (
            <Link key={edition.id} href={`/editions/${edition.id}`} className="group">
              <Card className="h-full hover:border-emerald-500 transition-colors overflow-hidden flex flex-col">
                <div className="aspect-[3/4] w-full bg-slate-200 dark:bg-slate-700 relative mb-4 overflow-hidden rounded-md">
                  {edition.cheminImageUne ? (
                    <img
                      src={edition.cheminImageUne}
                      alt={edition.titre}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <span className="text-4xl">📰</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 transition-colors">
                    {edition.titre}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Publié le {new Date(edition.datePublication).toLocaleDateString("fr-FR")}
                  </p>

                  {/* Matching Headlines */}
                  {edition.headlines && edition.headlines.length > 0 && (
                    <div className="space-y-2 mb-4 flex-1">
                      {edition.headlines
                        .filter(h => h.title.toLowerCase().includes(query.toLowerCase()))
                        .slice(0, 3)
                        .map((h, i) => (
                          <div key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-500 mt-1.5 text-[10px]">●</span>
                            <div className="flex flex-col">
                              <span className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
                                {h.title}
                              </span>
                              {h.category && (
                                <span className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">{h.category}</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Tags */}
                  {edition.tags && edition.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                      {edition.tags.map(tag => (
                        <span 
                          key={tag} 
                          className={`text-xs px-2 py-1 rounded-full ${
                            tag.toLowerCase().includes(query.toLowerCase())
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">
            Aucun résultat trouvé
          </h3>
          <p className="text-slate-500 mt-2">
            Essayez d'autres mots-clés ou vérifiez l'orthographe.
          </p>
          <Link href="/editions" className="text-emerald-600 hover:underline mt-4 inline-block">
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
