"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface Edition {
  id: string;
  titre: string;
  nombrePages: number;
}

type ViewMode = "single" | "double" | "flip";
type FlipDirection = "none" | "next" | "prev";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;
const PRELOAD_PAGES = 3;
const MOBILE_BREAKPOINT = 640;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function getDemoImageUrl(editionId: string, page: number): string {
  return `/api/demo/edition/${editionId}/pages/${page}/image`;
}

function ProgressBar({ current, total, onPageClick }: { current: number; total: number; onPageClick: (p: number) => void }) {
  return (
    <div
      className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const page = Math.ceil(((e.clientX - rect.left) / rect.width) * total);
        onPageClick(Math.max(1, Math.min(total, page)));
      }}
    >
      <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
    </div>
  );
}

export function DemoEditionReader() {
  const isMobile = useIsMobile();

  const [edition, setEdition] = useState<Edition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("flip");
  const [flipDirection, setFlipDirection] = useState<FlipDirection>("none");
  const [isFlipping, setIsFlipping] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  const effectiveViewMode = isMobile ? "single" : viewMode;
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const totalPages = edition?.nombrePages ?? 0;

  useEffect(() => {
    fetch("/api/demo/edition")
      .then((r) => r.json())
      .then((data) => {
        if (data.edition) setEdition(data.edition);
        else setError("Aucune édition disponible pour la démo.");
      })
      .catch(() => setError("Erreur de connexion."))
      .finally(() => setLoading(false));
  }, []);

  // Préchargement des pages adjacentes
  useEffect(() => {
    if (!edition) return;
    for (let i = 1; i <= PRELOAD_PAGES; i++) {
      [currentPage + i, currentPage - i].forEach((p) => {
        if (p >= 1 && p <= totalPages && !loadedImages.has(p)) {
          const img = new Image();
          img.src = getDemoImageUrl(edition.id, p);
          img.onload = () => setLoadedImages((prev) => new Set(prev).add(p));
        }
      });
    }
  }, [currentPage, edition, totalPages, loadedImages]);

  // Clavier
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (isFlipping) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goToNextPage();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrevPage();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "+": case "=":
          e.preventDefault();
          setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
          break;
        case "-":
          e.preventDefault();
          setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
          break;
        case "0":
          e.preventDefault();
          setZoom(1);
          break;
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [currentPage, totalPages, isFlipping, viewMode]);

  // Plein écran
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Auto-hide contrôles en plein écran
  useEffect(() => {
    const handler = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isFullscreen) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    };
    window.addEventListener("mousemove", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen]);

  const flipTo = useCallback((dir: FlipDirection, newPage: number) => {
    if (isFlipping) return;
    setFlipDirection(dir);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setFlipDirection("none");
      setIsFlipping(false);
    }, 600);
  }, [isFlipping]);

  const goToNextPage = useCallback(() => {
    if (currentPage >= totalPages || isFlipping) return;
    if (effectiveViewMode === "flip") flipTo("next", currentPage + 1);
    else setCurrentPage((p) => p + 1);
  }, [currentPage, totalPages, isFlipping, effectiveViewMode, flipTo]);

  const goToPrevPage = useCallback(() => {
    if (currentPage <= 1 || isFlipping) return;
    if (effectiveViewMode === "flip") flipTo("prev", currentPage - 1);
    else setCurrentPage((p) => p - 1);
  }, [currentPage, isFlipping, effectiveViewMode, flipTo]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isFlipping) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    if (dt < 300 && Math.abs(dx) > 50 && Math.abs(dy) < 100) {
      if (dx > 0) goToPrevPage();
      else goToNextPage();
    }
    touchStartRef.current = null;
  }, [isFlipping, goToNextPage, goToPrevPage]);

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Chargement de l'édition...</p>
        </div>
      </div>
    );
  }

  if (error || !edition) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4 p-8 bg-red-900/20 rounded-lg max-w-md text-center">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400">{error || "Édition introuvable"}</p>
        </div>
      </div>
    );
  }

  const CtrlBtn = ({ onClick, title, children, active = false, disabled = false, hideOnMobile = false }: {
    onClick: () => void; title: string; children: React.ReactNode;
    active?: boolean; disabled?: boolean; hideOnMobile?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg transition-all ${hideOnMobile ? "hidden sm:flex" : ""} ${
        disabled ? "opacity-40 cursor-not-allowed"
        : active ? "bg-blue-500 text-white"
        : "hover:bg-gray-700 text-gray-300 active:bg-gray-600"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-gray-900 text-gray-100"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Barre supérieure */}
      <div className={`flex items-center justify-between px-2 sm:px-4 py-2 border-b bg-gray-800/90 border-gray-700 backdrop-blur-sm transition-all duration-300 ${showControls || !isFullscreen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        {/* Gauche : zoom */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <CtrlBtn onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))} title="Zoom -" disabled={zoom <= ZOOM_MIN} hideOnMobile>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg>
          </CtrlBtn>
          <span className="text-sm font-medium min-w-[3rem] text-center hidden sm:block">{Math.round(zoom * 100)}%</span>
          <CtrlBtn onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))} title="Zoom +" disabled={zoom >= ZOOM_MAX} hideOnMobile>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /></svg>
          </CtrlBtn>
          <CtrlBtn onClick={() => setRotation((r) => (r + 90) % 360)} title="Rotation" hideOnMobile>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </CtrlBtn>
        </div>

        {/* Centre : navigation */}
        <div className="flex items-center gap-1 sm:gap-3">
          <button onClick={goToPrevPage} disabled={currentPage <= 1 || isFlipping} className="p-2 min-w-[44px] min-h-[44px] sm:p-1 flex items-center justify-center hover:bg-gray-700 rounded disabled:opacity-40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-medium whitespace-nowrap">
            <span className="sm:hidden">{currentPage}/{totalPages}</span>
            <span className="hidden sm:inline">Page {currentPage} / {totalPages}</span>
          </span>
          <button onClick={goToNextPage} disabled={currentPage >= totalPages || isFlipping} className="p-2 min-w-[44px] min-h-[44px] sm:p-1 flex items-center justify-center hover:bg-gray-700 rounded disabled:opacity-40">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Droite : plein écran + mode + s'abonner */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Mode d'affichage */}
          <div className="hidden sm:flex items-center gap-1 mr-2">
            {(["flip", "single", "double"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${viewMode === m ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
              >
                {m === "flip" ? "📖" : m === "single" ? "Simple" : "Double"}
              </button>
            ))}
          </div>

          <CtrlBtn onClick={toggleFullscreen} title="Plein écran (F)">
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            )}
          </CtrlBtn>

          <a
            href="https://www.offresopecam.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            S'abonner
          </a>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="px-4 py-1 bg-gray-800">
        <ProgressBar current={currentPage} total={totalPages} onPageClick={setCurrentPage} />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 relative">
        {/* Zones de tap mobile */}
        <button onClick={goToPrevPage} disabled={currentPage <= 1 || isFlipping} className="absolute left-0 top-0 bottom-0 w-1/4 z-10 sm:hidden disabled:opacity-0" aria-label="Page précédente" />
        <button onClick={goToNextPage} disabled={currentPage >= totalPages || isFlipping} className="absolute right-0 top-0 bottom-0 w-1/4 z-10 sm:hidden disabled:opacity-0" aria-label="Page suivante" />

        <div className="relative transition-transform duration-300 ease-out" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: "center center" }}>
          {effectiveViewMode === "flip" ? (
            <div className="flip-book-container" style={{ perspective: "1500px" }}>
              <div className="relative flex">
                {/* Page gauche */}
                <div className="page-left relative">
                  <img
                    src={getDemoImageUrl(edition.id, currentPage > 1 ? currentPage - 1 : 1)}
                    alt={`Page ${currentPage > 1 ? currentPage - 1 : 1}`}
                    className={`max-h-[calc(100vh-12rem)] w-auto shadow-xl rounded-l-sm ${currentPage === 1 ? "opacity-30" : ""}`}
                    style={{ maxWidth: "45vw" }}
                    draggable={false}
                  />
                </div>

                {/* Page qui tourne */}
                {isFlipping && (
                  <div
                    className={`page-flip absolute left-1/2 origin-left ${flipDirection === "next" ? "animate-flip-next" : "animate-flip-prev"}`}
                    style={{ transformStyle: "preserve-3d", zIndex: 10 }}
                  >
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                      <img src={getDemoImageUrl(edition.id, flipDirection === "next" ? currentPage : currentPage - 1)} alt="Page tournante" className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl" style={{ maxWidth: "45vw" }} draggable={false} />
                    </div>
                    <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <img src={getDemoImageUrl(edition.id, flipDirection === "next" ? currentPage + 1 : currentPage)} alt="Page verso" className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl" style={{ maxWidth: "45vw", transform: "scaleX(-1)" }} draggable={false} />
                    </div>
                  </div>
                )}

                {/* Page droite (courante) */}
                <div className="page-right relative">
                  <img
                    ref={imageRef}
                    src={getDemoImageUrl(edition.id, currentPage)}
                    alt={`Page ${currentPage}`}
                    className={`max-h-[calc(100vh-12rem)] w-auto shadow-xl rounded-r-sm transition-opacity duration-300 ${isFlipping ? "opacity-50" : "opacity-100"}`}
                    style={{ maxWidth: "45vw" }}
                    onLoad={() => setLoadedImages((p) => new Set(p).add(currentPage))}
                    draggable={false}
                  />
                  <button onClick={goToNextPage} disabled={currentPage >= totalPages || isFlipping} className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/10 to-transparent disabled:opacity-0" aria-label="Page suivante" />
                  <button onClick={goToPrevPage} disabled={currentPage <= 1 || isFlipping} className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/10 to-transparent disabled:opacity-0" aria-label="Page précédente" />
                </div>

                {/* Reliure */}
                <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 shadow-inner" />
              </div>
            </div>
          ) : effectiveViewMode === "single" ? (
            <img
              ref={imageRef}
              src={getDemoImageUrl(edition.id, currentPage)}
              alt={`Page ${currentPage}`}
              className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl rounded-sm"
              onLoad={() => setLoadedImages((p) => new Set(p).add(currentPage))}
              draggable={false}
            />
          ) : (
            <div className="flex gap-1">
              {currentPage > 1 && (
                <img src={getDemoImageUrl(edition.id, currentPage - 1)} alt={`Page ${currentPage - 1}`} className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl rounded-sm" draggable={false} />
              )}
              <img
                ref={imageRef}
                src={getDemoImageUrl(edition.id, currentPage)}
                alt={`Page ${currentPage}`}
                className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl rounded-sm"
                onLoad={() => setLoadedImages((p) => new Set(p).add(currentPage))}
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Barre inférieure */}
      <div className={`flex items-center justify-between px-2 sm:px-4 py-2 text-xs border-t bg-gray-800/90 border-gray-700 text-gray-400 backdrop-blur-sm transition-all duration-300 ${showControls || !isFullscreen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-300 truncate max-w-[180px] sm:max-w-none">{edition.titre}</span>
          <span className="hidden sm:inline text-gray-500">— Aperçu démo</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://www.offresopecam.online/" target="_blank" rel="noopener noreferrer" className="sm:hidden px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">
            S'abonner
          </a>
          <span className="hidden sm:inline">← → Naviguer · F Plein écran · +/- Zoom</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes flipNext {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(-180deg); }
        }
        @keyframes flipPrev {
          from { transform: rotateY(-180deg); }
          to { transform: rotateY(0deg); }
        }
        .animate-flip-next { animation: flipNext 0.6s ease-in-out forwards; }
        .animate-flip-prev { animation: flipPrev 0.6s ease-in-out forwards; }
        .page-flip { transform-style: preserve-3d; }
        .flip-book-container { user-select: none; }
      `}</style>
    </div>
  );
}
