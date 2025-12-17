'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ReadingProgressItem {
  id: string;
  editionId: string;
  edition: {
    id: string;
    titre: string;
    datePublication: string;
    type: string;
    cheminImageUne: string | null;
    nombrePages: number | null;
  };
  pageNumber: number;
  totalPages: number;
  percentage: number;
  lastReadAt: string;
}

export default function ReadingHistoryPage() {
  const [history, setHistory] = useState<ReadingProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | '7days' | '30days'>('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/reading-sessions?limit=50');
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      setHistory(data.data || []);
    } catch {
      setError('Impossible de charger l\'historique');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    
    const lastRead = new Date(item.lastReadAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24));
    
    if (filter === '7days') return diffDays <= 7;
    if (filter === '30days') return diffDays <= 30;
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Historique de lecture</h1>
              <p className="text-slate-600">Retrouvez vos éditions récentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tout' },
            { key: '7days', label: '7 derniers jours' },
            { key: '30days', label: '30 derniers jours' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune lecture récente</h3>
            <p className="text-slate-600 mb-4">
              Commencez à lire une édition pour voir votre historique ici.
            </p>
            <Link
              href="/editions"
              className="inline-block bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              Parcourir les éditions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Link
                key={item.id}
                href={`/editions/${item.editionId}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  {/* Image */}
                  <div className="w-24 h-32 sm:w-32 sm:h-40 bg-slate-100 flex-shrink-0 relative">
                    {item.edition.cheminImageUne ? (
                      <Image
                        src={item.edition.cheminImageUne}
                        alt={item.edition.titre}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">
                          {item.edition.titre}
                        </h3>
                        <span className="flex-shrink-0 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {item.edition.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Dernière lecture : {formatDate(item.lastReadAt)}
                      </p>
                    </div>

                    {/* Barre de progression */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">
                          Page {item.pageNumber} / {item.totalPages}
                        </span>
                        <span className="font-medium text-emerald-600">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Flèche */}
                  <div className="flex items-center pr-4">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
