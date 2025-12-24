"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Headline {
  title: string;
  page: number;
  category?: string;
}

interface EditionSummaryProps {
  headlines: Headline[];
  tags: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  ECONOMIE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  POLITIQUE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  TECH: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  SOCIETE: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  EDUCATION: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  SPORT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

export function EditionSummary({ headlines, tags }: EditionSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasHeadlines = headlines.length > 0;
  const hasTags = tags.length > 0;

  if (!hasHeadlines && !hasTags) return null;

  // Show only first 4 headlines by default
  const visibleHeadlines = isExpanded ? headlines : headlines.slice(0, 4);
  const hasMore = headlines.length > 4;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-6">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
          
          {/* Section Sommaire */}
          {hasHeadlines && (
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📑</span> Dans cette édition
              </h3>
              <div className="space-y-3">
                {visibleHeadlines.map((headline, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 group"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mt-0.5">
                      {headline.page}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-relaxed">
                        {headline.title}
                      </span>
                      {headline.category && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium w-fit mt-1 ${CATEGORY_COLORS[headline.category] || "bg-slate-100 text-slate-800"}`}>
                          {headline.category}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                >
                  {isExpanded ? (
                    <>Voir moins <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                  ) : (
                    <>Voir tout le sommaire ({headlines.length}) <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Section Tags (Sidebar style on desktop) */}
          {hasTags && (
            <div className="md:w-72 shrink-0">
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <span>🏷️</span> Sujets clés
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
