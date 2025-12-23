"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Headline {
  title: string;
  page: number;
}

interface EditionSummaryProps {
  headlines: Headline[];
  tags: string[];
}

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
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-relaxed">
                      {headline.title}
                    </span>
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
