"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  titre: string;
  datePublication: string;
  cheminImageUne: string | null;
  headlines: { title: string; page: number }[] | null;
  tags: string[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un article, un sujet..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
      </div>

      {isOpen && query.length >= 2 && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full mt-2 w-full rounded-xl border border-slate-100 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 z-50 max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Recherche en cours...</div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/editions/${result.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {result.cheminImageUne ? (
                      <img
                        src={result.cheminImageUne}
                        alt=""
                        className="h-16 w-12 rounded object-cover bg-slate-200"
                      />
                    ) : (
                      <div className="h-16 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white truncate">
                        {result.titre}
                      </div>
                      <div className="text-xs text-slate-500 mb-1">
                        {new Date(result.datePublication).toLocaleDateString("fr-FR")}
                      </div>
                      
                      {/* Highlight matching headlines */}
                      {result.headlines && (
                        <div className="space-y-1">
                          {result.headlines
                            .filter(h => h.title.toLowerCase().includes(query.toLowerCase()))
                            .slice(0, 2)
                            .map((h, i) => (
                              <div key={i} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                                {h.title} (p.{h.page})
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                Aucun résultat trouvé pour "{query}"
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
