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
type ReadMode = "continu" | "livre";
type Theme    = "clair" | "sepia" | "sombre";

// ─── Constants ────────────────────────────────────────────────────────────────
const ZOOM_STEP      = 0.1;
const ZOOM_MIN       = 0.3;
const ZOOM_MAX       = 4;
const PRELOAD        = 3;
const CACHE_NAME     = "demo-editions-v1";
const MAX_CACHED     = 5;
const CACHE_META_KEY = "demo-offline-editions";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const imgUrl = (id: string, page: number) =>
  `/api/demo/edition/${id}/pages/${page}/image`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── Offline cache helpers ────────────────────────────────────────────────────
interface CachedMeta { id: string; titre: string; pages: number; cachedAt: number }

function getCacheMeta(): CachedMeta[] {
  try { return JSON.parse(localStorage.getItem(CACHE_META_KEY) ?? "[]"); } catch { return []; }
}
function saveCacheMeta(list: CachedMeta[]) {
  localStorage.setItem(CACHE_META_KEY, JSON.stringify(list));
}

async function pruneOldEditions() {
  if (!("caches" in window)) return;
  const list = getCacheMeta();
  if (list.length <= MAX_CACHED) return;
  const sorted = [...list].sort((a, b) => b.cachedAt - a.cachedAt);
  const toKeep = sorted.slice(0, MAX_CACHED);
  const toNuke = sorted.slice(MAX_CACHED);
  const cache  = await caches.open(CACHE_NAME);
  for (const ed of toNuke) {
    for (let p = 1; p <= ed.pages; p++) await cache.delete(imgUrl(ed.id, p));
  }
  saveCacheMeta(toKeep);
}

async function cacheEditionBackground(edition: Edition) {
  if (!("caches" in window)) return;
  const list = getCacheMeta();
  if (list.find((e) => e.id === edition.id)) return;
  const cache = await caches.open(CACHE_NAME);
  for (let p = 1; p <= edition.nombrePages; p++) {
    try {
      const url = imgUrl(edition.id, p);
      if (!(await cache.match(url))) {
        const res = await fetch(url);
        if (res.ok) await cache.put(url, res);
      }
    } catch { /* réseau indisponible */ }
  }
  saveCacheMeta([...list, { id: edition.id, titre: edition.titre, pages: edition.nombrePages, cachedAt: Date.now() }]);
  await pruneOldEditions();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, onHide }: { msg: string; onHide: () => void }) {
  useEffect(() => { const t = setTimeout(onHide, 2500); return () => clearTimeout(t); }, [onHide]);
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl animate-fade-in">
      {msg}
    </div>
  );
}

function ProgressBar({ current, total, onClick }: { current: number; total: number; onClick: (p: number) => void }) {
  return (
    <div
      className="w-full h-1 bg-gray-200 cursor-pointer shrink-0"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const p = Math.max(1, Math.min(total, Math.ceil(((e.clientX - rect.left) / rect.width) * total)));
        onClick(p);
      }}
    >
      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
    </div>
  );
}

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
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2">
          {Array.from({ length: edition.nombrePages }, (_, i) => i + 1).map((p) => (
            <button key={p} ref={p === current ? ref : null} onClick={() => { onSelect(p); onClose(); }}
              className={`relative rounded overflow-hidden border-2 transition-all ${p === current ? "border-amber-500 ring-2 ring-amber-200" : "border-transparent hover:border-gray-300"}`}>
              <img src={imgUrl(edition.id, p)} alt={`Page ${p}`} className="w-full aspect-[3/4] object-cover bg-gray-100" loading="lazy" />
              <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white py-0.5">{p}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function SearchPanel({ edition, onGo, onClose, theme }: {
  edition: Edition; onGo: (p: number) => void; onClose: () => void; theme: Theme;
}) {
  const [q, setQ] = useState("");
  const bg = theme === "sombre" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900";
  const inputBg = theme === "sombre" ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400";
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    return [...edition.headlines.filter(h => h.title.toLowerCase().includes(lq)),
            ...edition.tags.filter(t => t.toLowerCase().includes(lq)).map(t => ({ title: `#${t}`, page: 1 }))].slice(0, 20);
  }, [q, edition]);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className={`fixed left-1/2 -translate-x-1/2 top-20 w-full max-w-md z-50 rounded-2xl shadow-2xl border ${bg} overflow-hidden`}>
        <div className="p-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input autoFocus type="text" placeholder="Rechercher un article…" value={q} onChange={(e) => setQ(e.target.value)}
            className={`flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 ${inputBg}`} />
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {q.trim() && (
          <div className="max-h-72 overflow-y-auto border-t border-gray-100">
            {results.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">Aucun résultat</p>
              : results.map((r, i) => (
                <button key={i} onClick={() => { onGo(r.page); onClose(); }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left ${theme === "sombre" ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}>
                  <span className="truncate pr-4">{r.title}</span>
                  <span className="text-amber-500 font-semibold shrink-0">p. {r.page}</span>
                </button>
              ))}
          </div>
        )}
      </div>
    </>
  );
}

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
    setDone(true); setRunning(false);
  }, [edition]);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={!running ? onClose : undefined} />
      <div className={`fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-80 z-50 rounded-2xl shadow-2xl border p-6 ${bg}`}>
        <h3 className="font-bold text-base mb-1">Lecture hors-ligne</h3>
        <p className={`text-sm mb-4 ${theme === "sombre" ? "text-gray-400" : "text-gray-500"}`}>Précharger les {edition.nombrePages} pages.</p>
        {!done && !running && <button onClick={start} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm">Précharger maintenant</button>}
        {running && <div><div className="flex justify-between text-sm mb-1.5"><span>Chargement…</span><span className="font-semibold">{progress}%</span></div><div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} /></div></div>}
        {done && <div className="flex flex-col items-center gap-2"><div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><p className="text-sm font-semibold text-green-600">Toutes les pages sont prêtes !</p><button onClick={onClose} className="mt-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm">Fermer</button></div>}
        {!running && !done && <button onClick={onClose} className="w-full mt-2 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100">Annuler</button>}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DemoEditionReader() {
  const [edition,       setEdition]       = useState<Edition | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [zoom,          setZoom]          = useState(1);
  const [readMode,      setReadMode]      = useState<ReadMode>("continu");
  const [theme]                           = useState<Theme>("clair");
  // null = pas d'animation ; sinon décrit le flip en cours (double-page spread)
  const [flipState, setFlipState] = useState<{
    dir: "fwd" | "bwd";
    frontPage: number;       // face avant de la carte animée
    backPage: number;        // face arrière (nouvelle page)
    bgLeft: number | null;   // arrière-plan gauche pendant l'animation
    bgRight: number | null;  // arrière-plan droite pendant l'animation
  } | null>(null);
  const [showThumbnails,setShowThumbnails]= useState(false);
  const [showSearch,    setShowSearch]    = useState(false);
  const [showOffline,   setShowOffline]   = useState(false);
  const [showMobileMenu,setShowMobileMenu]= useState(false);
  const [toast,         setToast]         = useState<string | null>(null);
  const [topBarVisible, setTopBarVisible] = useState(true);
  const [loadPct,       setLoadPct]       = useState(0);

  const containerRef  = useRef<HTMLDivElement>(null);
  const contentRef    = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchDistRef  = useRef<number | null>(null);
  const pinchZoomRef  = useRef<number>(1);
  const lastTapRef    = useRef<{ time: number; x: number; y: number } | null>(null);
  const preloadedRef  = useRef<Set<number>>(new Set());
  const lastScrollY   = useRef(0);

  const totalPages = edition?.nombrePages ?? 0;

  // ── Spread computation (mode Livre) ───────────────────────────────────────
  // Pages impaires = côté droit, pages paires = côté gauche (convention livre occidental)
  const rightPage = useMemo(() => {
    if (!totalPages || currentPage <= 1) return 1;
    return currentPage % 2 === 1 ? currentPage : Math.min(currentPage + 1, totalPages);
  }, [currentPage, totalPages]);
  const leftPage: number | null = useMemo(() => rightPage > 1 ? rightPage - 1 : null, [rightPage]);

  // ── Fetch edition ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/demo/edition")
      .then((r) => r.json())
      .then((data) => {
        setLoadPct(100);
        if (data.edition) {
          setEdition(data.edition);
          const saved = localStorage.getItem(`demo-page-${data.edition.id}`);
          if (saved) {
            const p = parseInt(saved);
            if (p > 1 && p <= data.edition.nombrePages) setCurrentPage(p);
          }
        } else {
          setError("Aucune édition disponible.");
        }
      })
      .catch(() => setError("Erreur de connexion."));
  }, []);

  // ── Progression simulée ────────────────────────────────────────────────────
  useEffect(() => {
    const steps: [number, number][] = [[20, 150], [45, 400], [65, 800], [80, 1300], [90, 1900]];
    const timers = steps.map(([pct, delay]) =>
      setTimeout(() => setLoadPct((prev) => Math.max(prev, pct)), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Reset zoom on mode change ──────────────────────────────────────────────
  useEffect(() => { setZoom(1); }, [readMode]);

  // ── Auto offline cache ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!edition) return;
    const t = setTimeout(() => cacheEditionBackground(edition), 3000);
    return () => clearTimeout(t);
  }, [edition]);

  // ── Save page progress ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!edition) return;
    localStorage.setItem(`demo-page-${edition.id}`, String(currentPage));
  }, [currentPage, edition]);

  // ── Auto-hide top bar on scroll ────────────────────────────────────────────
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = () => {
      const y = el.scrollTop;
      const delta = y - lastScrollY.current;
      if (delta > 8) setTopBarVisible(false);
      else if (delta < -8) setTopBarVisible(true);
      lastScrollY.current = y;
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  });

  // ── Auto-orientation (tablette paysage → livre) ────────────────────────────
  useEffect(() => {
    const check = () => {
      if (window.innerWidth >= 768 && window.matchMedia("(orientation: landscape)").matches)
        setReadMode("livre");
    };
    window.addEventListener("orientationchange", check);
    return () => window.removeEventListener("orientationchange", check);
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
  const goTo = useCallback((raw: number) => {
    if (!edition || raw < 1 || raw > totalPages) return;
    if (navigator.vibrate) navigator.vibrate(20);

    if (readMode === "livre" && !flipState) {
      // Cible = page droite du spread cible
      const target = raw <= 1 ? 1 : raw % 2 === 1 ? raw : Math.min(raw + 1, totalPages);
      if (target === rightPage) return;
      const dir: "fwd" | "bwd" = target > rightPage ? "fwd" : "bwd";

      // Un seul spread d'écart → animation flip
      const newRight = target;
      const newLeft: number | null = newRight > 1 ? newRight - 1 : null;
      const isSingleStep = Math.abs(newRight - rightPage) <= 2;

      if (isSingleStep) {
        if (dir === "fwd") {
          // La page DROITE actuelle (rightPage) se retourne vers la gauche
          setFlipState({
            dir,
            frontPage: rightPage,               // face avant = page droite qui part
            backPage: Math.min(rightPage + 1, totalPages), // face arrière = nouvelle page gauche
            bgLeft: leftPage,                   // arrière-plan gauche = ancienne page gauche
            bgRight: newRight <= totalPages ? newRight : null, // arrière-plan droite = nouvelle page droite
          });
        } else {
          // La page GAUCHE actuelle se retourne vers la droite
          if (leftPage === null) return;
          setFlipState({
            dir,
            frontPage: leftPage,                // face avant = page gauche qui part
            backPage: Math.max(1, leftPage - 1), // face arrière = nouvelle page droite
            bgLeft: newLeft,                    // arrière-plan gauche = nouvelle page gauche
            bgRight: rightPage,                 // arrière-plan droite = ancienne page droite
          });
        }
        setCurrentPage(target);
        setTimeout(() => setFlipState(null), 700);
      } else {
        // Grand saut → pas d'animation
        setCurrentPage(target);
      }
    } else if (readMode !== "livre") {
      setCurrentPage(raw);
    }
  }, [edition, totalPages, readMode, rightPage, leftPage, flipState]);

  const goNext = useCallback(() => {
    if (readMode === "livre") goTo(Math.min(rightPage + 2, totalPages));
    else goTo(currentPage + 1);
  }, [currentPage, rightPage, totalPages, readMode, goTo]);

  const goBack = useCallback(() => {
    if (readMode === "livre") goTo(Math.max(1, rightPage - 2));
    else goTo(currentPage - 1);
  }, [currentPage, rightPage, readMode, goTo]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); goBack(); }
      if (e.key === "Escape")     { setShowThumbnails(false); setShowSearch(false); setShowOffline(false); }
      if (e.key === "f")          { containerRef.current?.requestFullscreen(); }
      if (e.key === "+")          { setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))); }
      if (e.key === "-")          { setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [goNext, goBack]);

  // ── Touch gestures ─────────────────────────────────────────────────────────
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
      setZoom(+Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchZoomRef.current * (dist / pinchDistRef.current))).toFixed(2));
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

    // Horizontal swipe
    if (dt < 350 && Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      dx > 0 ? goBack() : goNext();
      touchStartRef.current = null;
      return;
    }

    // Vertical swipe in livre mode
    if (readMode === "livre" && dt < 350 && Math.abs(dy) > 60 && Math.abs(dx) < 80) {
      dy < 0 ? goNext() : goBack();
      touchStartRef.current = null;
      return;
    }

    // Tap (single / double)
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
      const now = Date.now();
      const isCenterX = ex > window.innerWidth * 0.2 && ex < window.innerWidth * 0.8;
      if (
        lastTapRef.current &&
        now - lastTapRef.current.time < 350 &&
        Math.abs(ex - lastTapRef.current.x) < 40 &&
        Math.abs(ey - lastTapRef.current.y) < 40
      ) {
        // Double tap → zoom
        setZoom((z) => z > 1.2 ? 1 : 2);
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, x: ex, y: ey };
        // Single center tap → toggle top bar
        if (isCenterX) setTopBarVisible((v) => !v);
      }
    }
    touchStartRef.current = null;
  }, [goNext, goBack, readMode]);

  // ── Theme classes ──────────────────────────────────────────────────────────
  const bgMain    = theme === "sombre" ? "bg-gray-900"  : theme === "sepia" ? "bg-amber-50"  : "bg-white";
  const bgContent = theme === "sombre" ? "bg-gray-800"  : theme === "sepia" ? "bg-amber-100" : "bg-gray-100";
  const bgBar     = theme === "sombre" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const textMain  = theme === "sombre" ? "text-white"   : "text-gray-900";
  const textSub   = theme === "sombre" ? "text-gray-400": "text-gray-500";
  const btnHover  = theme === "sombre" ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600";

  // ── Error screen ───────────────────────────────────────────────────────────
  if (error && !edition) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <p className="text-red-500 text-sm">{error}</p>
    </div>
  );

  // ── Loading screen (single, clean) ────────────────────────────────────────
  if (!edition) return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8"
      style={{ background: "linear-gradient(135deg, #0d3320 0%, #1a5c35 40%, #237a46 70%, #1a5c35 100%)" }}>
      <div className="text-center">
        <p className="text-white/60 text-xs tracking-[0.3em] uppercase mb-2">Cameroon Tribune</p>
        <h1 className="text-white text-3xl font-bold tracking-wide drop-shadow-lg">Édition Numérique</h1>
        <p className="text-white/50 text-sm mt-1">Chargement en cours…</p>
      </div>
      <div className="w-72">
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${loadPct}%`, background: "linear-gradient(90deg,#f59e0b,#fbbf24,#fde68a)", boxShadow: "0 0 12px #f59e0b88" }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-white/40 text-xs">Initialisation</span>
          <span className="text-amber-300 text-xs font-semibold">{loadPct}%</span>
        </div>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-white/30"
            style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );

  // ── Reader ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-screen ${bgMain} ${textMain} select-none`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── TOP BAR (auto-hide) ──────────────────────────────────────────── */}
      <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${topBarVisible ? "max-h-16" : "max-h-0"}`}>
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${bgBar} shadow-sm`}>

          {/* MOBILE */}
          <div className="flex sm:hidden items-center gap-2 w-full">
            <a href="https://www.offresopecam.online/" target="_blank" rel="noopener noreferrer"
              className="relative flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-amber-500 text-amber-600 font-semibold text-xs hover:bg-amber-50 transition-colors shrink-0">
              Voir les offres
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </a>
            <div className="flex items-center gap-1 flex-1 justify-center">
              <button onClick={goBack} disabled={currentPage <= 1} className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <select value={currentPage} onChange={(e) => goTo(Number(e.target.value))}
                className={`px-2 py-1 rounded-full border text-xs font-semibold outline-none cursor-pointer ${theme === "sombre" ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-white text-gray-900"}`}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>P.{p}/{totalPages}</option>
                ))}
              </select>
              <button onClick={goNext} disabled={currentPage >= totalPages} className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))} className={`p-1.5 rounded-full shrink-0 ${btnHover}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))} className={`p-1.5 rounded-full shrink-0 ${btnHover}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            <button onClick={() => setShowMobileMenu(true)} className="p-1.5 rounded-full border border-gray-200 bg-white shadow-sm shrink-0 text-gray-600 hover:bg-gray-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* DESKTOP */}
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <button onClick={() => setShowThumbnails(true)} className={`p-2 rounded-full shrink-0 ${btnHover}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <a href="https://www.offresopecam.online/" target="_blank" rel="noopener noreferrer"
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-amber-500 text-amber-600 font-semibold text-sm hover:bg-amber-50 transition-colors shrink-0">
              Voir les offres
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </a>
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-sm leading-tight truncate ${textMain}`}>Édition Démo</p>
              <p className={`text-xs leading-tight ${textSub}`}>{fmtDate(edition.datePublication)} · DÉMO PUBLIQUE — SOPECAM</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              <button onClick={goBack} disabled={currentPage <= 1} className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <select value={currentPage} onChange={(e) => goTo(Number(e.target.value))}
                className={`px-3 py-1.5 rounded-full border text-sm font-semibold outline-none cursor-pointer ${theme === "sombre" ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-white text-gray-900"}`}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>Page {p} / {totalPages}</option>
                ))}
              </select>
              <button onClick={goNext} disabled={currentPage >= totalPages} className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
              {([
                { value: "continu" as ReadMode, label: "Continu", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg> },
                { value: "livre"   as ReadMode, label: "Livre",   icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/></svg> },
              ]).map((m) => (
                <button key={m.value} onClick={() => setReadMode(m.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${readMode === m.value ? "bg-gray-900 text-white" : theme === "sombre" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
                  {m.icon}<span>{m.label}</span>
                </button>
              ))}
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200"}`}>
              <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))} disabled={zoom <= ZOOM_MIN} className={`p-1 rounded disabled:opacity-30 ${btnHover}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
              </button>
              <span className={`text-sm font-medium w-12 text-center ${theme === "sombre" ? "text-gray-200" : "text-gray-700"}`}>{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))} disabled={zoom >= ZOOM_MAX} className={`p-1 rounded disabled:opacity-30 ${btnHover}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <button onClick={() => containerRef.current?.requestFullscreen()} className={`p-2 rounded-full ${btnHover}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── PROGRESS BAR ────────────────────────────────────────────────── */}
      <ProgressBar current={currentPage} total={totalPages} onClick={goTo} />

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        className={`flex-1 overflow-auto flex items-center justify-center ${readMode === "continu" ? "p-0 items-start" : ""} ${bgContent}`}
        style={{ touchAction: "pan-y pinch-zoom" }}
        onClick={(e) => {
          if (readMode === "continu") return;
          if ((e.target as HTMLElement).closest("button,a,select")) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const rel  = (e.clientX - rect.left) / rect.width;
          if (rel < 0.3) goBack();
          else if (rel > 0.7) goNext();
        }}
      >
        {readMode === "continu" ? (
          <div style={{ width: zoom === 1 ? "100%" : `${zoom * 100}%`, margin: "0 auto" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <img key={p} src={imgUrl(edition.id, p)} alt={`Page ${p}`}
                className="w-full block" loading={p <= 3 ? "eager" : "lazy"} draggable={false} />
            ))}
          </div>
        ) : (
          /*
           * Mode Livre : DOUBLE PAGE (spread) + flip 3D 180°
           *   Left side  = pages paires
           *   Right side = pages impaires (ou page 1 seule)
           *   Spine au milieu
           *   Animation : la page DROITE tourne vers la gauche (fwd),
           *               la page GAUCHE tourne vers la droite (bwd)
           */
          <div className="relative flex justify-center w-full min-h-full"
            style={{ alignItems: zoom > 1 ? "flex-start" : "flex-end", paddingBottom: zoom > 1 ? 0 : "2vh" }}>

            {/* ── Spread statique ── */}
            <div className="flex items-end justify-center" style={{ width: "100%" }}>
              {/* PAGE GAUCHE */}
              <div className="flex items-end justify-end" style={{ width: "calc(50% - 4px)" }}>
                {(flipState ? flipState.bgLeft : leftPage) != null ? (
                  <img
                    key={`left-${flipState ? flipState.bgLeft : leftPage}`}
                    src={imgUrl(edition.id, (flipState ? flipState.bgLeft : leftPage)!)}
                    alt="page gauche"
                    className="rounded-l-sm shadow-2xl block"
                    style={{
                      maxWidth: `calc((50vw - 8px) * ${zoom})`,
                      maxHeight: `calc((96vh - 60px) * ${zoom})`,
                      width: "auto", height: "auto",
                    }}
                    draggable={false}
                  />
                ) : (
                  <div style={{ width: `calc((50vw - 8px) * ${zoom})`, height: `calc((96vh - 60px) * ${zoom})` }} />
                )}
              </div>

              {/* SPINE */}
              <div className="shrink-0 self-stretch"
                style={{ width: "8px", background: "linear-gradient(to right, rgba(0,0,0,0.18), rgba(255,255,255,0.7) 50%, rgba(0,0,0,0.15))", boxShadow: "inset 0 0 6px rgba(0,0,0,0.12)" }} />

              {/* PAGE DROITE */}
              <div className="flex items-end justify-start" style={{ width: "calc(50% - 4px)" }}>
                {(flipState ? flipState.bgRight : rightPage) != null ? (
                  <img
                    key={`right-${flipState ? flipState.bgRight : rightPage}`}
                    src={imgUrl(edition.id, (flipState ? flipState.bgRight : rightPage)!)}
                    alt="page droite"
                    className="rounded-r-sm shadow-2xl block"
                    style={{
                      maxWidth: `calc((50vw - 8px) * ${zoom})`,
                      maxHeight: `calc((96vh - 60px) * ${zoom})`,
                      width: "auto", height: "auto",
                    }}
                    draggable={false}
                  />
                ) : (
                  <div style={{ width: `calc((50vw - 8px) * ${zoom})`, height: `calc((96vh - 60px) * ${zoom})` }} />
                )}
              </div>
            </div>

            {/* ── Carte flip 3D (perspective 70vw = proportionnelle à la page) ── */}
            {flipState && (
              <div className="absolute inset-0 pointer-events-none" style={{ perspective: "70vw" }}>
                {/* Ombre portée SUR LE FOND — ancre la page en rotation sur la table */}
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  width: "calc(50% - 4px)",
                  ...(flipState.dir === "fwd" ? { right: 0 } : { left: 0 }),
                  background: "rgba(0,0,0,0.18)",
                  animation: "castShadow 700ms ease-in-out forwards",
                  borderRadius: "2px",
                }} />

                {/* Carte principale */}
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  width: "calc(50% - 4px)",
                  ...(flipState.dir === "fwd"
                    ? { right: 0, transformOrigin: "left bottom" }
                    : { left: 0, transformOrigin: "right bottom" }
                  ),
                  transformStyle: "preserve-3d",
                  animation: `bookFlip${flipState.dir === "fwd" ? "Fwd" : "Bwd"} 700ms cubic-bezier(0.45, 0, 0.55, 1) forwards`,
                }}>
                  {/* Face AVANT : page qui s'en va */}
                  <div className="absolute inset-0 flex items-end"
                    style={{
                      justifyContent: flipState.dir === "fwd" ? "flex-start" : "flex-end",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}>
                    <img src={imgUrl(edition.id, flipState.frontPage)} alt=""
                      style={{
                        maxWidth: `calc((50vw - 8px) * ${zoom})`,
                        maxHeight: `calc((96vh - 60px) * ${zoom})`,
                        width: "auto", height: "auto",
                      }}
                      className="shadow-2xl" draggable={false} />
                    {/* Ombre de courbure : du bord EXTÉRIEUR vers la spine, peak à 50% */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: flipState.dir === "fwd"
                        ? "linear-gradient(to left, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)"
                        : "linear-gradient(to right, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)",
                      animation: "curlShadow 700ms ease-in-out forwards",
                    }} />
                    {/* Reflet lumineux au point de pliure (ligne brillante) */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: flipState.dir === "fwd"
                        ? "linear-gradient(to right, transparent 55%, rgba(255,255,255,0.18) 65%, transparent 75%)"
                        : "linear-gradient(to left, transparent 55%, rgba(255,255,255,0.18) 65%, transparent 75%)",
                      animation: "foldHighlight 700ms ease-in-out forwards",
                    }} />
                  </div>
                  {/* Face ARRIÈRE : nouvelle page */}
                  <div className="absolute inset-0 flex items-end"
                    style={{
                      justifyContent: flipState.dir === "fwd" ? "flex-start" : "flex-end",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}>
                    <img src={imgUrl(edition.id, flipState.backPage)} alt=""
                      style={{
                        maxWidth: `calc((50vw - 8px) * ${zoom})`,
                        maxHeight: `calc((96vh - 60px) * ${zoom})`,
                        width: "auto", height: "auto",
                        transform: "scaleX(-1)",
                      }}
                      className="shadow-2xl" draggable={false} />
                    {/* Ombre d'atterrissage : s'efface en arrivant */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: "rgba(0,0,0,0.25)",
                      animation: "landShadow 700ms ease-in-out forwards",
                      transform: "scaleX(-1)",
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── PANELS ──────────────────────────────────────────────────────── */}
      {showThumbnails && <ThumbnailPanel edition={edition} current={currentPage} onSelect={goTo} onClose={() => setShowThumbnails(false)} theme={theme} />}
      {showSearch     && <SearchPanel   edition={edition} onGo={goTo} onClose={() => setShowSearch(false)} theme={theme} />}
      {showOffline    && <OfflinePanel  edition={edition} onClose={() => setShowOffline(false)} theme={theme} />}
      {toast          && <Toast msg={toast} onHide={() => setToast(null)} />}

      {/* ── MOBILE MENU DRAWER ─────────────────────────────────────────── */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-5 pb-8 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">MODE DE LECTURE</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {([
                { value: "continu" as ReadMode, label: "Continu", icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="1.5"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg> },
                { value: "livre"   as ReadMode, label: "Livre",   icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/></svg> },
              ]).map((m) => (
                <button key={m.value} onClick={() => { setReadMode(m.value); setShowMobileMenu(false); }}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${readMode === m.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {m.icon}{m.label}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">ZOOM</p>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg">−</button>
              <span className="w-16 text-center text-sm font-semibold text-gray-900">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg">+</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setShowThumbnails(true); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Miniatures
              </button>
              <button onClick={() => { containerRef.current?.requestFullscreen(); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                Plein écran
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }

        /* Règle 3 : pas de scaleX — la perspective gère seule la compression */
        @keyframes bookFlipFwd {
          0%   { transform: rotateY(0deg);    }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes bookFlipBwd {
          0%   { transform: rotateY(0deg);   }
          100% { transform: rotateY(180deg); }
        }
        /* Règle 4 : ombre portée sur le fond — ancre la page en rotation */
        @keyframes castShadow {
          0%   { opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; }
        }
        /* Ombre de courbure sur la face avant : invisible → forte → invisible */
        @keyframes curlShadow {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
        /* Reflet lumineux à la ligne de pliure : apparaît en debut de rotation */
        @keyframes foldHighlight {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          50%  { opacity: 0; }
          100% { opacity: 0; }
        }
        /* Ombre d'atterrissage sur la face arrière : s'efface en atterrissant */
        @keyframes landShadow {
          0%   { opacity: 0.8; }
          70%  { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
