"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface Edition {
  id: string;
  titre: string;
  nombrePages: number;
  datePublication: string;
}

type ReadMode = "mini" | "continu" | "livre";
type Theme = "clair" | "sepia" | "sombre";

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3;

function getDemoImageUrl(editionId: string, page: number) {
  return `/api/demo/edition/${editionId}/pages/${page}/image`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DemoEditionReader() {
  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [zoom, setZoom] = useState(1.37);
  const [readMode, setReadMode] = useState<ReadMode>("continu");
  const [theme, setTheme] = useState<Theme>("clair");
  const [showSettings, setShowSettings] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const totalPages = edition?.nombrePages ?? 0;

  useEffect(() => {
    fetch("/api/demo/edition")
      .then((r) => r.json())
      .then((data) => {
        if (data.edition) { setEdition(data.edition); setPageInput("1"); }
        else setError("Aucune édition disponible.");
      })
      .catch(() => setError("Erreur de connexion."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPageInput(String(currentPage)); }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage >= totalPages || isFlipping) return;
    if (readMode === "livre") {
      setIsFlipping(true);
      setTimeout(() => { setCurrentPage((p) => p + 1); setIsFlipping(false); }, 500);
    } else {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, totalPages, isFlipping, readMode]);

  const goToPrevPage = useCallback(() => {
    if (currentPage <= 1 || isFlipping) return;
    if (readMode === "livre") {
      setIsFlipping(true);
      setTimeout(() => { setCurrentPage((p) => p - 1); setIsFlipping(false); }, 500);
    } else {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage, isFlipping, readMode]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.key === "ArrowRight" || e.key === " ") && !["INPUT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault(); goToNextPage();
      }
      if (e.key === "ArrowLeft" && !["INPUT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault(); goToPrevPage();
      }
      if (e.key === "Escape") setShowSettings(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [goToNextPage, goToPrevPage]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    if (dt < 300 && Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      dx > 0 ? goToPrevPage() : goToNextPage();
    }
    touchStartRef.current = null;
  }, [goToNextPage, goToPrevPage]);

  const bgMain = theme === "sombre" ? "bg-gray-900" : theme === "sepia" ? "bg-amber-50" : "bg-white";
  const bgContent = theme === "sombre" ? "bg-gray-800" : theme === "sepia" ? "bg-amber-100" : "bg-gray-100";
  const bgBar = theme === "sombre" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const textMain = theme === "sombre" ? "text-white" : "text-gray-900";
  const textSub = theme === "sombre" ? "text-gray-400" : "text-gray-500";
  const btnHover = theme === "sombre" ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600";

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !edition) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p className="text-red-500 text-sm">{error || "Édition introuvable"}</p>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-screen ${bgMain} ${textMain}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── TOP BAR ── */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${bgBar} shadow-sm z-20 shrink-0`}>

        {/* Left : Retour + titre */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => window.history.back()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors shrink-0 ${theme === "sombre" ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <div className="hidden sm:block min-w-0">
            <p className={`font-bold text-sm leading-tight truncate ${textMain}`}>{edition.titre}</p>
            <p className={`text-xs leading-tight ${textSub}`}>
              {formatDate(edition.datePublication)} · DÉMO PUBLIQUE — SOPECAM
            </p>
          </div>
        </div>

        {/* Center : Voir les offres */}
        <a
          href="https://www.offresopecam.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-amber-500 text-amber-600 font-semibold text-sm hover:bg-amber-50 transition-colors shrink-0"
        >
          Voir les offres
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>

        {/* Right : Search + Zoom + Settings */}
        <div className="flex items-center gap-1">
          <button className={`p-2 rounded-full transition-colors ${btnHover}`} title="Rechercher">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Zoom */}
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full border ${theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200"}`}>
            <button
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
              disabled={zoom <= ZOOM_MIN}
              className={`p-1 rounded transition-colors disabled:opacity-30 ${btnHover}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className={`text-sm font-medium w-12 text-center ${theme === "sombre" ? "text-gray-200" : "text-gray-700"}`}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
              disabled={zoom >= ZOOM_MAX}
              className={`p-1 rounded transition-colors disabled:opacity-30 ${btnHover}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`p-2 rounded-full transition-colors ${showSettings ? "bg-green-900 text-white" : btnHover}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className={`flex-1 overflow-auto flex items-start justify-center py-8 px-4 ${bgContent} relative`}>

        {/* Settings panel */}
        {showSettings && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)} />
            <div className={`fixed right-4 top-[4.5rem] w-72 rounded-2xl shadow-2xl z-40 p-5 border ${theme === "sombre" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>

              {/* Mode de lecture */}
              <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">MODE DE LECTURE</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {([
                  { value: "mini" as ReadMode, label: "Mini", icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="5" y="3" width="14" height="18" rx="1.5"/>
                      <line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="14" x2="12" y2="14"/>
                    </svg>
                  )},
                  { value: "continu" as ReadMode, label: "Continu", icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="1.5"/>
                      <line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/>
                    </svg>
                  )},
                  { value: "livre" as ReadMode, label: "Livre", icon: (
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/>
                    </svg>
                  )},
                ]).map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setReadMode(m.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-xs font-medium transition-all ${readMode === m.value ? "bg-green-900 text-white" : theme === "sombre" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Thème visuel */}
              <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">THÈME VISUEL</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {([
                  { value: "clair" as Theme, label: "Clair", lines: "bg-gray-200" },
                  { value: "sepia" as Theme, label: "Sépia", lines: "bg-amber-300" },
                  { value: "sombre" as Theme, label: "Sombre", lines: "bg-gray-500" },
                ]).map((th) => (
                  <button
                    key={th.value}
                    onClick={() => setTheme(th.value)}
                    className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${theme === th.value ? (theme === "sombre" ? "border-white" : "border-gray-800") : "border-transparent"}`}
                  >
                    <div className={`w-12 h-9 rounded-lg border flex flex-col justify-center px-2 gap-1.5 ${th.value === "clair" ? "bg-white border-gray-200" : th.value === "sepia" ? "bg-amber-50 border-amber-200" : "bg-gray-900 border-gray-700"}`}>
                      <div className={`h-1 rounded-full ${th.lines}`} />
                      <div className={`h-1 rounded-full w-3/4 ${th.lines}`} />
                    </div>
                    <span className={theme === "sombre" ? "text-gray-300" : "text-gray-600"}>{th.label}</span>
                  </button>
                ))}
              </div>

              {/* Optimiser Offline */}
              <button className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-2 ${theme === "sombre" ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                Optimiser lecture Offline
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Rechercher + Plein écran */}
              <div className="grid grid-cols-2 gap-2">
                <button className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium ${theme === "sombre" ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Rechercher
                </button>
                <button
                  onClick={() => { setShowSettings(false); containerRef.current?.requestFullscreen(); }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium ${theme === "sombre" ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  Plein écran
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page image */}
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
          className="transition-transform duration-200"
        >
          {readMode === "livre" ? (
            <div className="flex shadow-2xl">
              {currentPage > 1 && (
                <img
                  src={getDemoImageUrl(edition.id, currentPage - 1)}
                  alt={`Page ${currentPage - 1}`}
                  className="max-h-[80vh] w-auto rounded-l-sm"
                  style={{ maxWidth: "40vw" }}
                  draggable={false}
                />
              )}
              <img
                src={getDemoImageUrl(edition.id, currentPage)}
                alt={`Page ${currentPage}`}
                className={`max-h-[80vh] w-auto shadow-2xl ${currentPage > 1 ? "rounded-r-sm" : "rounded-sm"}`}
                style={{ maxWidth: currentPage > 1 ? "40vw" : "80vw" }}
                draggable={false}
              />
            </div>
          ) : (
            <img
              src={getDemoImageUrl(edition.id, currentPage)}
              alt={`Page ${currentPage}`}
              className="shadow-2xl rounded-sm"
              style={{
                maxHeight: readMode === "mini" ? "60vh" : "82vh",
                maxWidth: readMode === "mini" ? "50vw" : "88vw",
              }}
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className={`flex items-center justify-center gap-4 px-6 py-3 border-t ${bgBar} shrink-0`}>
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${btnHover}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => {
              const v = parseInt(pageInput);
              if (v >= 1 && v <= totalPages) setCurrentPage(v);
              else setPageInput(String(currentPage));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = parseInt(pageInput);
                if (v >= 1 && v <= totalPages) setCurrentPage(v);
                else setPageInput(String(currentPage));
                (e.target as HTMLInputElement).blur();
              }
            }}
            className={`w-10 text-center text-sm font-semibold bg-transparent outline-none ${theme === "sombre" ? "text-white" : "text-gray-900"}`}
          />
          <span className={`text-sm ${textSub}`}>/ {totalPages}</span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${btnHover}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="px-3 py-1.5 rounded-full border border-amber-400 bg-amber-50 text-amber-600 text-xs font-bold tracking-wide">
          MODE DEMO PUBLIC
        </span>
      </div>
    </div>
  );
}
