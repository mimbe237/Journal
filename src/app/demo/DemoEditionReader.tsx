"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Headline { title: string; page: number }
interface Edition {
  id: string;
  titre: string;
  nombrePages: number;
  datePublication: string;
  headlines: Headline[];
  tags: string[];
}
type ReadMode = "mini" | "continu" | "livre";
type Theme    = "clair" | "sepia" | "sombre";

// ─── Constants ────────────────────────────────────────────────────────────────
const ZOOM_STEP = 0.1;
const ZOOM_MIN  = 0.3;
const ZOOM_MAX  = 4;
const PRELOAD   = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const imgUrl = (id: string, page: number) =>
  `/api/demo/edition/${id}/pages/${page}/image`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Toast notification */
function Toast({ msg, onHide }: { msg: string; onHide: () => void }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, [onHide]);
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl animate-fade-in">
      {msg}
    </div>
  );
}

/** Progress bar */
function ProgressBar({ current, total, onClick }: { current: number; total: number; onClick: (p: number) => void }) {
  return (
    <div
      className="w-full h-1 bg-gray-200 cursor-pointer group relative"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const p = Math.max(1, Math.min(total, Math.ceil(((e.clientX - rect.left) / rect.width) * total)));
        onClick(p);
      }}
    >
      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition-opacity">
        {current}/{total}
      </div>
    </div>
  );
}

/** Miniatures panel */
function ThumbnailPanel({ edition, current, onSelect, onClose, theme }: {
  edition: Edition; current: number; onSelect: (p: number) => void; onClose: () => void; theme: Theme;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [current]);
  const bg = theme === "sombre" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className={`fixed left-0 top-0 bottom-0 w-52 z-50 shadow-2xl border-r overflow-y-auto ${bg}`}>
        <div className={`sticky top-0 flex items-center justify-between px-3 py-2 border-b ${bg} z-10`}>
          <span className={`text-xs font-bold tracking-widest ${theme === "sombre" ? "text-gray-400" : "text-gray-500"}`}>PAGES</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2">
          {Array.from({ length: edition.nombrePages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              ref={p === current ? ref : null}
              onClick={() => { onSelect(p); onClose(); }}
              className={`relative rounded overflow-hidden border-2 transition-all ${p === current ? "border-amber-500 ring-2 ring-amber-200" : "border-transparent hover:border-gray-300"}`}
            >
              <img
                src={imgUrl(edition.id, p)}
                alt={`Page ${p}`}
                className="w-full aspect-[3/4] object-cover bg-gray-100"
                loading="lazy"
              />
              <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white py-0.5">{p}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** Search panel */
function SearchPanel({ edition, onGo, onClose, theme }: {
  edition: Edition; onGo: (p: number) => void; onClose: () => void; theme: Theme;
}) {
  const [q, setQ] = useState("");
  const bg = theme === "sombre" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900";
  const inputBg = theme === "sombre" ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400";

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    const headlineHits = edition.headlines.filter(h => h.title.toLowerCase().includes(lq));
    const tagHits = edition.tags.filter(t => t.toLowerCase().includes(lq)).map(t => ({ title: `#${t}`, page: 1 }));
    return [...headlineHits, ...tagHits].slice(0, 20);
  }, [q, edition]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className={`fixed left-1/2 -translate-x-1/2 top-20 w-full max-w-md z-50 rounded-2xl shadow-2xl border ${bg} overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              autoFocus
              type="text"
              placeholder="Rechercher un article, un sujet..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 ${inputBg}`}
            />
            <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
        {q.trim() && (
          <div className="max-h-72 overflow-y-auto border-t border-gray-100 dark:border-gray-700">
            {results.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Aucun résultat pour "{q}"</p>
            ) : results.map((r, i) => (
              <button
                key={i}
                onClick={() => { onGo(r.page); onClose(); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors ${theme === "sombre" ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
              >
                <span className="truncate pr-4">{r.title}</span>
                <span className="text-amber-500 font-semibold shrink-0">p. {r.page}</span>
              </button>
            ))}
          </div>
        )}
        {!q.trim() && edition.tags.length > 0 && (
          <div className="px-4 pb-4">
            <p className={`text-xs font-bold tracking-widest mb-2 ${theme === "sombre" ? "text-gray-500" : "text-gray-400"}`}>SUJETS</p>
            <div className="flex flex-wrap gap-2">
              {edition.tags.map((t) => (
                <button key={t} onClick={() => setQ(t)} className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100">
                  #{t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/** Offline prefetch panel */
function OfflinePanel({ edition, onClose, theme }: { edition: Edition; onClose: () => void; theme: Theme }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone]         = useState(false);
  const [running, setRunning]   = useState(false);
  const bg = theme === "sombre" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900";

  const start = useCallback(async () => {
    setRunning(true);
    let loaded = 0;
    const total = edition.nombrePages;
    for (let p = 1; p <= total; p++) {
      await new Promise<void>((res) => {
        const img = new Image();
        img.src = imgUrl(edition.id, p);
        img.onload = img.onerror = () => { loaded++; setProgress(Math.round((loaded / total) * 100)); res(); };
      });
    }
    setDone(true);
    setRunning(false);
  }, [edition]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={!running ? onClose : undefined} />
      <div className={`fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-80 z-50 rounded-2xl shadow-2xl border p-6 ${bg}`}>
        <h3 className="font-bold text-base mb-1">Lecture hors-ligne</h3>
        <p className={`text-sm mb-4 ${theme === "sombre" ? "text-gray-400" : "text-gray-500"}`}>
          Précharger les {edition.nombrePages} pages pour lire sans connexion.
        </p>
        {!done && !running && (
          <button onClick={start} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors">
            Précharger maintenant
          </button>
        )}
        {running && (
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span>Chargement...</span><span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {done && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-sm font-semibold text-green-600">Toutes les pages sont prêtes !</p>
            <button onClick={onClose} className="mt-1 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">Fermer</button>
          </div>
        )}
        {!running && !done && (
          <button onClick={onClose} className="w-full mt-2 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">Annuler</button>
        )}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DemoEditionReader() {
  // Data
  const [edition,  setEdition]  = useState<Edition | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // Reader state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput,   setPageInput]   = useState("1");
  const [zoom,        setZoom]        = useState(1.37);
  const [readMode,    setReadMode]    = useState<ReadMode>("continu");
  const [theme,       setTheme]       = useState<Theme>("clair");
  const [isFlipping,  setIsFlipping]  = useState(false);

  // UI panels
  const [showSettings,   setShowSettings]   = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showSearch,     setShowSearch]     = useState(false);
  const [showOffline,    setShowOffline]    = useState(false);
  const [toast,          setToast]          = useState<string | null>(null);

  // Refs
  const containerRef      = useRef<HTMLDivElement>(null);
  const touchStartRef     = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchDistRef      = useRef<number | null>(null);
  const pinchZoomRef      = useRef<number>(1);
  const lastTapRef        = useRef<{ time: number; x: number; y: number } | null>(null);
  const preloadedRef      = useRef<Set<number>>(new Set());

  const totalPages = edition?.nombrePages ?? 0;

  // ── Fetch edition ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/demo/edition")
      .then((r) => r.json())
      .then((data) => {
        if (data.edition) {
          setEdition(data.edition);
          // Restore last page
          const saved = localStorage.getItem(`demo-page-${data.edition.id}`);
          if (saved) { const p = parseInt(saved); if (p > 1 && p <= data.edition.nombrePages) { setCurrentPage(p); setPageInput(saved); } }
        } else { setError("Aucune édition disponible."); }
      })
      .catch(() => setError("Erreur de connexion."))
      .finally(() => setLoading(false));
  }, []);

  // ── Save page progress ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!edition) return;
    localStorage.setItem(`demo-page-${edition.id}`, String(currentPage));
    setPageInput(String(currentPage));
  }, [currentPage, edition]);

  // ── Auto-orientation detection ─────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      const isTablet = window.innerWidth >= 768;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      if (isTablet && isLandscape) setReadMode("livre");
      else if (isTablet) setReadMode("continu");
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => { window.removeEventListener("resize", check); window.removeEventListener("orientationchange", check); };
  }, []);

  // ── Preload adjacent pages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!edition) return;
    for (let i = 1; i <= PRELOAD; i++) {
      [currentPage + i, currentPage - i].forEach((p) => {
        if (p >= 1 && p <= totalPages && !preloadedRef.current.has(p)) {
          const img = new Image();
          img.src = imgUrl(edition.id, p);
          img.onload = () => preloadedRef.current.add(p);
        }
      });
    }
  }, [currentPage, edition, totalPages]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((p: number) => {
    if (!edition || p < 1 || p > totalPages) return;
    if (readMode === "livre" && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => { setCurrentPage(p); setIsFlipping(false); }, 400);
    } else {
      setCurrentPage(p);
    }
  }, [edition, totalPages, readMode, isFlipping]);

  const goNext = useCallback(() => goTo(currentPage + 1), [currentPage, goTo]);
  const goBack = useCallback(() => goTo(currentPage - 1), [currentPage, goTo]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); goBack(); }
      if (e.key === "Escape")     { setShowSettings(false); setShowThumbnails(false); setShowSearch(false); setShowOffline(false); }
      if (e.key === "f")          { containerRef.current?.requestFullscreen(); }
      if (e.key === "+")          { setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))); }
      if (e.key === "-")          { setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))); }
      if (e.key === "0")          { setZoom(1); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [goNext, goBack]);

  // ── Touch: pinch-to-zoom + double-tap + swipe ─────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistRef.current  = Math.sqrt(dx * dx + dy * dy);
      pinchZoomRef.current  = zoom;
      touchStartRef.current = null;
    } else {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      pinchDistRef.current  = null;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistRef.current !== null) {
      e.preventDefault();
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchZoomRef.current * (dist / pinchDistRef.current)));
      setZoom(+next.toFixed(2));
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    pinchDistRef.current = null;
    if (!touchStartRef.current) return;
    const { x, y, time } = touchStartRef.current;
    const ex = e.changedTouches[0].clientX;
    const ey = e.changedTouches[0].clientY;
    const dx = ex - x;
    const dy = ey - y;
    const dt = Date.now() - time;

    // Swipe
    if (dt < 350 && Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      dx > 0 ? goBack() : goNext();
      touchStartRef.current = null;
      return;
    }

    // Double-tap
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 250) {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current.time < 350 && Math.abs(ex - lastTapRef.current.x) < 40 && Math.abs(ey - lastTapRef.current.y) < 40) {
        setZoom((z) => z > 1.2 ? 1 : 2);
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, x: ex, y: ey };
      }
    }
    touchStartRef.current = null;
  }, [goNext, goBack]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/demo`;
    if (navigator.share) {
      navigator.share({ title: edition?.titre ?? "Journal Numérique", url });
    } else {
      navigator.clipboard.writeText(url).then(() => setToast("Lien copié !"));
    }
  }, [edition]);

  // ── Theme classes ─────────────────────────────────────────────────────────
  const bgMain    = theme === "sombre" ? "bg-gray-900"  : theme === "sepia" ? "bg-amber-50"  : "bg-white";
  const bgContent = theme === "sombre" ? "bg-gray-800"  : theme === "sepia" ? "bg-amber-100" : "bg-gray-100";
  const bgBar     = theme === "sombre" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const textMain  = theme === "sombre" ? "text-white"   : "text-gray-900";
  const textSub   = theme === "sombre" ? "text-gray-400": "text-gray-500";
  const btnHover  = theme === "sombre" ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600";

  // ── Loading / Error ────────────────────────────────────────────────────────
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
      className={`flex flex-col h-screen ${bgMain} ${textMain} select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${bgBar} shadow-sm z-20 shrink-0`}>

        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Retour */}
          <button
            onClick={() => window.history.back()}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors shrink-0 ${theme === "sombre" ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Retour
          </button>
          {/* Miniatures */}
          <button
            onClick={() => setShowThumbnails(true)}
            title="Miniatures des pages"
            className={`p-2 rounded-full transition-colors ${btnHover}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
          {/* Title */}
          <div className="hidden sm:block min-w-0">
            <p className={`font-bold text-sm leading-tight truncate ${textMain}`}>{edition.titre}</p>
            <p className={`text-xs leading-tight ${textSub}`}>{fmtDate(edition.datePublication)} · DÉMO PUBLIQUE — SOPECAM</p>
          </div>
        </div>

        {/* Center */}
        <a
          href="https://www.offresopecam.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-amber-500 text-amber-600 font-semibold text-sm hover:bg-amber-50 transition-colors shrink-0"
        >
          Voir les offres
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </a>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* Zoom */}
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full border ${theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200"}`}>
            <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))} disabled={zoom <= ZOOM_MIN} className={`p-1 rounded disabled:opacity-30 transition-colors ${btnHover}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className={`text-sm font-medium w-12 text-center ${theme === "sombre" ? "text-gray-200" : "text-gray-700"}`}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))} disabled={zoom >= ZOOM_MAX} className={`p-1 rounded disabled:opacity-30 transition-colors ${btnHover}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          {/* Settings */}
          <button onClick={() => setShowSettings((v) => !v)} className={`p-2 rounded-full transition-colors ${showSettings ? "bg-green-900 text-white" : btnHover}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── PROGRESS BAR ────────────────────────────────────────────────── */}
      <ProgressBar current={currentPage} total={totalPages} onClick={goTo} />

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className={`flex-1 overflow-auto flex items-start justify-center py-8 px-4 ${bgContent} relative`}
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        {/* Settings panel */}
        {showSettings && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowSettings(false)} />
            <div className={`fixed right-4 top-[5rem] w-72 rounded-2xl shadow-2xl z-40 p-5 border ${theme === "sombre" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900"}`}>

              <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">MODE DE LECTURE</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {([
                  { value: "mini"    as ReadMode, label: "Mini",    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="7" y="3" width="10" height="18" rx="1"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="14" x2="12" y2="14"/></svg> },
                  { value: "continu" as ReadMode, label: "Continu", icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg> },
                  { value: "livre"   as ReadMode, label: "Livre",   icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/></svg> },
                ]).map((m) => (
                  <button key={m.value} onClick={() => setReadMode(m.value)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl text-xs font-medium transition-all ${readMode === m.value ? "bg-green-900 text-white" : theme === "sombre" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">THÈME VISUEL</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {([
                  { value: "clair" as Theme, label: "Clair", preview: "bg-white border-gray-200",   lines: "bg-gray-200" },
                  { value: "sepia" as Theme, label: "Sépia", preview: "bg-amber-50 border-amber-200", lines: "bg-amber-300" },
                  { value: "sombre"as Theme, label: "Sombre",preview: "bg-gray-900 border-gray-700", lines: "bg-gray-500" },
                ]).map((th) => (
                  <button key={th.value} onClick={() => setTheme(th.value)}
                    className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${theme === th.value ? theme === "sombre" ? "border-white" : "border-gray-800" : "border-transparent"}`}>
                    <div className={`w-12 h-9 rounded-lg border flex flex-col justify-center px-2 gap-1.5 ${th.preview}`}>
                      <div className={`h-1 rounded-full ${th.lines}`} />
                      <div className={`h-1 rounded-full w-3/4 ${th.lines}`} />
                    </div>
                    <span className={theme === "sombre" ? "text-gray-300" : "text-gray-600"}>{th.label}</span>
                  </button>
                ))}
              </div>

            </div>
          </>
        )}

        {/* Click zones gauche / droite */}
        {currentPage > 1 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-w-resize"
            onClick={goBack}
          />
        )}
        {currentPage < totalPages && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-e-resize"
            onClick={goNext}
          />
        )}

        {/* Page image */}
        <div
          className="transition-transform duration-200 ease-out relative z-20"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {readMode === "livre" ? (
            <div className={`flex shadow-2xl transition-opacity duration-400 ${isFlipping ? "opacity-50" : "opacity-100"}`}>
              {currentPage > 1 && (
                <img src={imgUrl(edition.id, currentPage - 1)} alt={`Page ${currentPage - 1}`}
                  className="max-h-[80vh] w-auto rounded-l-sm" style={{ maxWidth: "42vw" }} draggable={false} />
              )}
              <img src={imgUrl(edition.id, currentPage)} alt={`Page ${currentPage}`}
                className={`max-h-[80vh] w-auto shadow-2xl ${currentPage > 1 ? "rounded-r-sm" : "rounded-sm"}`}
                style={{ maxWidth: currentPage > 1 ? "42vw" : "82vw" }} draggable={false} />
            </div>
          ) : (
            <img src={imgUrl(edition.id, currentPage)} alt={`Page ${currentPage}`}
              className="shadow-2xl rounded-sm"
              style={{ maxHeight: readMode === "mini" ? "60vh" : "82vh", maxWidth: readMode === "mini" ? "50vw" : "88vw" }}
              draggable={false} />
          )}
        </div>
      </div>

      {/* ── BOTTOM BAR ──────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-center gap-4 px-6 py-3 border-t ${bgBar} shrink-0`}>
        <button onClick={goBack} disabled={currentPage <= 1}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${btnHover}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <input
            type="number" min={1} max={totalPages} value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => { const v = parseInt(pageInput); if (v >= 1 && v <= totalPages) goTo(v); else setPageInput(String(currentPage)); }}
            onKeyDown={(e) => { if (e.key === "Enter") { const v = parseInt(pageInput); if (v >= 1 && v <= totalPages) goTo(v); else setPageInput(String(currentPage)); (e.target as HTMLInputElement).blur(); } }}
            className={`w-10 text-center text-sm font-semibold bg-transparent outline-none ${theme === "sombre" ? "text-white" : "text-gray-900"}`}
          />
          <span className={`text-sm ${textSub}`}>/ {totalPages}</span>
        </div>

        <button onClick={goNext} disabled={currentPage >= totalPages}
          className={`p-1.5 rounded-full transition-colors disabled:opacity-30 ${btnHover}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>

        <span className="px-3 py-1.5 rounded-full border border-amber-400 bg-amber-50 text-amber-600 text-xs font-bold tracking-wide">
          MODE DEMO PUBLIC
        </span>

      </div>

      {/* ── PANELS ──────────────────────────────────────────────────────── */}
      {showThumbnails && <ThumbnailPanel edition={edition} current={currentPage} onSelect={goTo} onClose={() => setShowThumbnails(false)} theme={theme} />}
      {showSearch     && <SearchPanel   edition={edition} onGo={(p) => { goTo(p); }} onClose={() => setShowSearch(false)} theme={theme} />}
      {showOffline    && <OfflinePanel  edition={edition} onClose={() => setShowOffline(false)} theme={theme} />}
      {toast          && <Toast msg={toast} onHide={() => setToast(null)} />}

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
