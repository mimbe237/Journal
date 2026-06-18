"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── Variant System ────────────────────────────────────────────────────────────

type VariantKey = "CT" | "WSL";

interface VariantConfig {
  brandName: string;
  loadingGradient: string;
  progressStyle: React.CSSProperties;
  offerBorderColor: string;
  offerTextColor: string;
  thumbActiveBorder: string;
}

const VARIANTS: Record<VariantKey, VariantConfig> = {
  CT: {
    brandName: "Cameroon Tribune",
    loadingGradient:
      "linear-gradient(135deg, #0d3320 0%, #1a5c35 40%, #237a46 70%, #1a5c35 100%)",
    progressStyle: {
      background: "linear-gradient(90deg,#f59e0b,#fbbf24,#fde68a)",
      boxShadow: "0 0 12px #f59e0b88",
    },
    offerBorderColor: "#f59e0b",
    offerTextColor: "#d97706",
    thumbActiveBorder: "border-amber-500 ring-2 ring-amber-200",
  },
  WSL: {
    brandName: "Weekend Sports & Loisirs",
    loadingGradient:
      "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 40%, #dc2626 70%, #b91c1c 100%)",
    progressStyle: {
      background: "linear-gradient(90deg,#dc2626,#ef4444,#16a34a)",
    },
    offerBorderColor: "#dc2626",
    offerTextColor: "#b91c1c",
    thumbActiveBorder: "border-red-500 ring-2 ring-red-200",
  },
};

function detectVariant(name?: string | null): VariantKey {
  if (!name) return "CT";
  const n = name.toLowerCase();
  if (n.includes("wsl") || n.includes("weekend") || n.includes("sport")) return "WSL";
  return "CT";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Edition {
  id: string;
  titre: string;
  nombrePages: number;
  datePublication: string;
  journalTypeName?: string | null;
}

type ReadMode = "continu" | "livre";
type Theme = "clair" | "sepia" | "sombre";

// ─── Constants ────────────────────────────────────────────────────────────────

const ZOOM_STEP = 0.1;
const ZOOM_MIN  = 0.3;
const ZOOM_MAX  = 4;
const PRELOAD   = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const guestImgUrl = (token: string, page: number) =>
  `/api/invite/${token}/pages/${page}/image`;

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, onHide }: { msg: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 2500);
    return () => clearTimeout(t);
  }, [onHide]);
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl animate-guest-fade-in">
      {msg}
    </div>
  );
}

function ProgressBar({
  current, total, onClick, style,
}: {
  current: number; total: number; onClick: (p: number) => void; style: React.CSSProperties;
}) {
  return (
    <div
      className="w-full h-1 bg-gray-200 cursor-pointer shrink-0"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const p = Math.max(1, Math.min(total, Math.ceil(((e.clientX - rect.left) / rect.width) * total)));
        onClick(p);
      }}
    >
      <div
        className="h-full transition-all duration-300 rounded-full"
        style={{ width: `${(current / total) * 100}%`, ...style }}
      />
    </div>
  );
}

function ThumbnailPanel({
  token, edition, current, onSelect, onClose, theme, variantCfg,
}: {
  token: string; edition: Edition; current: number;
  onSelect: (p: number) => void; onClose: () => void;
  theme: Theme; variantCfg: VariantConfig;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current]);
  const bg = theme === "sombre" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className={`fixed left-0 top-0 bottom-0 w-52 z-50 shadow-2xl border-r overflow-y-auto ${bg}`}>
        <div className={`sticky top-0 flex items-center justify-between px-3 py-2 border-b ${bg} z-10`}>
          <span className={`text-xs font-bold tracking-widest ${theme === "sombre" ? "text-gray-400" : "text-gray-500"}`}>
            PAGES
          </span>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 p-2">
          {Array.from({ length: edition.nombrePages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              ref={p === current ? ref : null}
              onClick={() => { onSelect(p); onClose(); }}
              className={`relative rounded overflow-hidden border-2 transition-all ${
                p === current ? variantCfg.thumbActiveBorder : "border-transparent hover:border-gray-300"
              }`}
            >
              <img
                src={guestImgUrl(token, p)}
                alt={`Page ${p}`}
                className="w-full aspect-[3/4] object-cover bg-gray-100"
                loading="lazy"
              />
              <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] bg-black/50 text-white py-0.5">
                {p}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GuestEditionReader({ token }: { token: string }) {
  const [edition,       setEdition]       = useState<Edition | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [zoom,          setZoom]          = useState(1);
  const [readMode,      setReadMode]      = useState<ReadMode>("continu");
  const [theme]                           = useState<Theme>("clair");
  const [flipState, setFlipState]         = useState<{
    dir: "fwd" | "bwd";
    frontPage: number;
    backPage: number;
    bgLeft: number | null;
    bgRight: number | null;
  } | null>(null);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast,          setToast]          = useState<string | null>(null);
  const [topBarVisible,  setTopBarVisible]  = useState(true);
  const [loadPct,        setLoadPct]        = useState(0);
  const [panOffset,      setPanOffset]      = useState({ x: 0, y: 0 });
  const [isMobile,       setIsMobile]       = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const contentRef    = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchDistRef  = useRef<number | null>(null);
  const pinchZoomRef  = useRef<number>(1);
  const lastTapRef    = useRef<{ time: number; x: number; y: number } | null>(null);
  const preloadedRef  = useRef<Set<number>>(new Set());
  const lastScrollY   = useRef(0);
  const panDragRef    = useRef({ active: false, x0: 0, y0: 0, px0: 0, py0: 0 });
  const panTouchRef   = useRef<{ x: number; y: number } | null>(null);

  const totalPages  = edition?.nombrePages ?? 0;
  const variant     = useMemo(() => detectVariant(edition?.journalTypeName), [edition?.journalTypeName]);
  const variantCfg  = VARIANTS[variant];

  // ── Spread computation ─────────────────────────────────────────────────────
  const rightPage = useMemo(() => {
    if (!totalPages || currentPage <= 1) return 1;
    return currentPage % 2 === 1 ? currentPage : Math.min(currentPage + 1, totalPages);
  }, [currentPage, totalPages]);

  const leftPage: number | null = useMemo(
    () => (rightPage > 1 ? rightPage - 1 : null),
    [rightPage],
  );

  const spreadOptions = useMemo(() => {
    if (!totalPages) return [];
    const opts: { value: number; label: string }[] = [{ value: 1, label: "Page 1" }];
    for (let r = 3; r <= totalPages; r += 2) {
      opts.push({ value: r, label: `Pages ${r - 1}-${Math.min(r, totalPages)}` });
    }
    return opts;
  }, [totalPages]);

  const pageLabel = useMemo(() => {
    if (readMode !== "livre") return `Page ${currentPage} / ${totalPages}`;
    if (leftPage && rightPage) return `Pages ${leftPage}-${rightPage} / ${totalPages}`;
    return `Page ${leftPage ?? rightPage} / ${totalPages}`;
  }, [currentPage, leftPage, readMode, rightPage, totalPages]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => {
        if (!r.ok) {
          setError("Ce lien de lecture est invalide ou a expiré.");
          setLoadPct(100);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setLoadPct(100);
        if (data.edition) {
          setEdition(data.edition);
          const saved = localStorage.getItem(`guest-page-${token}`);
          if (saved) {
            const p = parseInt(saved);
            if (p > 1 && p <= data.edition.nombrePages) setCurrentPage(p);
          }
        } else {
          setError("Édition introuvable.");
        }
      })
      .catch(() => { setError("Erreur de connexion."); setLoadPct(100); });
  }, [token]);

  // ── Loading progress simulation ────────────────────────────────────────────
  useEffect(() => {
    const steps: [number, number][] = [[20, 150], [45, 400], [65, 800], [80, 1300], [90, 1900]];
    const timers = steps.map(([pct, delay]) =>
      setTimeout(() => setLoadPct((prev) => Math.max(prev, pct)), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Zoom / pan resets ──────────────────────────────────────────────────────
  useEffect(() => { setZoom(1); }, [readMode]);
  useEffect(() => { setPanOffset({ x: 0, y: 0 }); }, [currentPage, readMode]);
  useEffect(() => { if (zoom === 1) setPanOffset({ x: 0, y: 0 }); }, [zoom]);

  // ── Save page progress ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!edition) return;
    localStorage.setItem(`guest-page-${token}`, String(currentPage));
  }, [currentPage, edition, token]);

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

  // ── Mobile detection ───────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Auto-orientation ───────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 640) {
        setReadMode("continu");
      } else if (window.innerWidth >= 768 && window.matchMedia("(orientation: landscape)").matches) {
        setReadMode("livre");
      }
    };
    check();
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
          img.src = guestImgUrl(token, p);
          img.onload = () => preloadedRef.current.add(p);
        }
      });
    }
  }, [currentPage, edition, token, totalPages]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((raw: number) => {
    if (!edition || raw < 1 || raw > totalPages) return;
    if (navigator.vibrate) navigator.vibrate(20);

    if (readMode === "livre" && !flipState) {
      const target = raw <= 1 ? 1 : raw % 2 === 1 ? raw : Math.min(raw + 1, totalPages);
      if (target === rightPage) return;
      const dir: "fwd" | "bwd" = target > rightPage ? "fwd" : "bwd";
      const newRight = target;
      const newLeft: number | null = newRight > 1 ? newRight - 1 : null;
      const isSingleStep = Math.abs(newRight - rightPage) <= 2;

      if (isSingleStep) {
        if (dir === "fwd") {
          setFlipState({
            dir, frontPage: rightPage,
            backPage: Math.min(rightPage + 1, totalPages),
            bgLeft: leftPage,
            bgRight: newRight <= totalPages ? newRight : null,
          });
        } else {
          if (leftPage === null) return;
          setFlipState({
            dir, frontPage: leftPage,
            backPage: Math.max(1, leftPage - 1),
            bgLeft: newLeft,
            bgRight: rightPage,
          });
        }
        setCurrentPage(target);
        setTimeout(() => setFlipState(null), 700);
      } else {
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
      if (e.key === "Escape")     { setShowThumbnails(false); }
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
      panTouchRef.current   = null;
    } else {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      pinchDistRef.current  = null;
      panTouchRef.current   = zoom > 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistRef.current !== null) {
      e.preventDefault();
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setZoom(+Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pinchZoomRef.current * (dist / pinchDistRef.current))).toFixed(2));
      return;
    }
    if (zoom > 1 && e.touches.length === 1 && panTouchRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panTouchRef.current.x;
      const dy = e.touches[0].clientY - panTouchRef.current.y;
      panTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPanOffset((prev) => {
        const maxX = (window.innerWidth  * (zoom - 1)) / 2;
        const maxY = (window.innerHeight * (zoom - 1)) / 2;
        return {
          x: Math.max(-maxX, Math.min(maxX, prev.x + dx)),
          y: Math.max(-maxY, Math.min(maxY, prev.y + dy)),
        };
      });
    }
  }, [zoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    pinchDistRef.current = null;
    panTouchRef.current  = null;
    if (!touchStartRef.current) return;

    const { x, y, time } = touchStartRef.current;
    const ex = e.changedTouches[0].clientX;
    const ey = e.changedTouches[0].clientY;
    const dx = ex - x;
    const dy = ey - y;
    const dt = Date.now() - time;

    if (zoom > 1) {
      if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
        const now = Date.now();
        if (
          lastTapRef.current && now - lastTapRef.current.time < 350 &&
          Math.abs(ex - lastTapRef.current.x) < 40 && Math.abs(ey - lastTapRef.current.y) < 40
        ) {
          setZoom(1);
          lastTapRef.current = null;
        } else {
          lastTapRef.current = { time: now, x: ex, y: ey };
        }
      }
      touchStartRef.current = null;
      return;
    }

    if (dt < 350 && Math.abs(dx) > 50 && Math.abs(dy) < 80) {
      dx > 0 ? goBack() : goNext();
      touchStartRef.current = null;
      return;
    }

    if (readMode === "livre" && dt < 350 && Math.abs(dy) > 60 && Math.abs(dx) < 80) {
      dy < 0 ? goNext() : goBack();
      touchStartRef.current = null;
      return;
    }

    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
      const now = Date.now();
      const isCenterX = ex > window.innerWidth * 0.2 && ex < window.innerWidth * 0.8;
      if (
        lastTapRef.current && now - lastTapRef.current.time < 350 &&
        Math.abs(ex - lastTapRef.current.x) < 40 && Math.abs(ey - lastTapRef.current.y) < 40
      ) {
        setZoom((z) => (z > 1.2 ? 1 : 2));
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, x: ex, y: ey };
        if (isCenterX) setTopBarVisible((v) => !v);
      }
    }
    touchStartRef.current = null;
  }, [goNext, goBack, readMode, zoom]);

  // ── Mouse drag-to-pan ──────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    if ((e.target as HTMLElement).closest("button,a,select,option")) return;
    panDragRef.current = { active: true, x0: e.clientX, y0: e.clientY, px0: panOffset.x, py0: panOffset.y };
    e.preventDefault();
  }, [zoom, panOffset.x, panOffset.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panDragRef.current.active) return;
    const dx   = e.clientX - panDragRef.current.x0;
    const dy   = e.clientY - panDragRef.current.y0;
    const maxX = (window.innerWidth  * (zoom - 1)) / 2;
    const maxY = (window.innerHeight * (zoom - 1)) / 2;
    setPanOffset({
      x: Math.max(-maxX, Math.min(maxX, panDragRef.current.px0 + dx)),
      y: Math.max(-maxY, Math.min(maxY, panDragRef.current.py0 + dy)),
    });
  }, [zoom]);

  const handleMouseUp = useCallback(() => { panDragRef.current.active = false; }, []);

  // ── Theme classes ──────────────────────────────────────────────────────────
  const bgMain    = theme === "sombre" ? "bg-gray-900"  : theme === "sepia" ? "bg-amber-50"  : "bg-white";
  const bgContent = theme === "sombre" ? "bg-gray-800"  : theme === "sepia" ? "bg-amber-100" : "bg-gray-100";
  const bgBar     = theme === "sombre" ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200";
  const textMain  = theme === "sombre" ? "text-white"   : "text-gray-900";
  const textSub   = theme === "sombre" ? "text-gray-400" : "text-gray-500";
  const btnHover  = theme === "sombre" ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600";

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && !edition) return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-gray-900 px-4">
      <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="text-center">
        <p className="text-white text-lg font-semibold mb-2">Lien invalide ou expiré</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <a href="/abonnement"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors">
          Découvrir nos abonnements
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!edition) return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8"
      style={{ background: variantCfg.loadingGradient }}
    >
      <div className="text-center">
        <p className="text-white/60 text-xs tracking-[0.3em] uppercase mb-2">{variantCfg.brandName}</p>
        <h1 className="text-white text-3xl font-bold tracking-wide drop-shadow-lg">Édition Numérique</h1>
        <p className="text-white/50 text-sm mt-1">Chargement en cours…</p>
      </div>
      <div className="w-72">
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${loadPct}%`, ...variantCfg.progressStyle }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-white/40 text-xs">Initialisation</span>
          <span className="text-white/80 text-xs font-semibold">{loadPct}%</span>
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
      {/* TOP BAR */}
      <div className={`shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${topBarVisible ? "max-h-16" : "max-h-0"}`}>
        <div className={`flex items-center justify-between px-4 py-2.5 border-b ${bgBar} shadow-sm`}>

          {/* ── MOBILE ── */}
          <div className="flex sm:hidden items-center gap-2 w-full">
            <a
              href="/abonnement"
              className="relative flex items-center gap-1 px-3 py-1.5 rounded-full border-2 font-semibold text-xs shrink-0"
              style={{ borderColor: variantCfg.offerBorderColor, color: variantCfg.offerTextColor }}
            >
              S'abonner
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </a>
            <div className="flex items-center gap-1 flex-1 justify-center">
              <button onClick={goBack} disabled={currentPage <= 1}
                className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <select
                value={readMode === "livre" ? rightPage : currentPage}
                onChange={(e) => goTo(Number(e.target.value))}
                className={`px-2 py-1 rounded-full border text-xs font-semibold outline-none cursor-pointer ${
                  theme === "sombre" ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-white text-gray-900"
                }`}
              >
                {readMode === "livre"
                  ? spreadOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
                  : Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
                      <option key={p} value={p}>P.{p}/{totalPages}</option>
                    )
                }
              </select>
              <button onClick={goNext} disabled={currentPage >= totalPages}
                className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-1.5 rounded-full border border-gray-200 bg-white shadow-sm shrink-0 text-gray-600 hover:bg-gray-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* ── DESKTOP ── */}
          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <button onClick={() => setShowThumbnails(true)} className={`p-2 rounded-full shrink-0 ${btnHover}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <a
              href="/abonnement"
              className="relative flex items-center gap-1.5 px-4 py-2 rounded-full border-2 font-semibold text-sm shrink-0"
              style={{ borderColor: variantCfg.offerBorderColor, color: variantCfg.offerTextColor }}
            >
              S'abonner
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </a>
            <div className="min-w-0 flex-1">
              <p className={`font-bold text-sm leading-tight truncate ${textMain}`}>{edition.titre}</p>
              <p className={`text-xs leading-tight ${textSub}`}>
                {fmtDate(edition.datePublication)} · {variantCfg.brandName} — ACCÈS INVITÉ
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1">
              <button onClick={goBack} disabled={currentPage <= 1}
                className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <select
                value={readMode === "livre" ? rightPage : currentPage}
                onChange={(e) => goTo(Number(e.target.value))}
                className={`px-3 py-1.5 rounded-full border text-sm font-semibold outline-none cursor-pointer ${
                  theme === "sombre" ? "border-gray-700 bg-gray-800 text-white" : "border-gray-200 bg-white text-gray-900"
                }`}
              >
                {readMode === "livre"
                  ? spreadOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
                  : Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
                      <option key={p} value={p}>Page {p} / {totalPages}</option>
                    )
                }
              </select>
              <button onClick={goNext} disabled={currentPage >= totalPages}
                className={`p-1.5 rounded-full disabled:opacity-30 ${btnHover}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Mode buttons */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
              theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
            }`}>
              {([
                {
                  value: "continu" as ReadMode, label: "Continu",
                  icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="1.5"/>
                    <line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/>
                    <line x1="7" y1="16" x2="13" y2="16"/>
                  </svg>,
                },
                {
                  value: "livre" as ReadMode, label: "Livre",
                  icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/>
                  </svg>,
                },
              ] as const).map((m) => (
                <button key={m.value} onClick={() => setReadMode(m.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    readMode === m.value
                      ? "bg-gray-900 text-white"
                      : theme === "sombre" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
                  }`}>
                  {m.icon}<span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Zoom */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
              theme === "sombre" ? "border-gray-700 bg-gray-800" : "border-gray-200"
            }`}>
              <button
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
                disabled={zoom <= ZOOM_MIN}
                className={`p-1 rounded disabled:opacity-30 ${btnHover}`}
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
                className={`p-1 rounded disabled:opacity-30 ${btnHover}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            <button onClick={() => containerRef.current?.requestFullscreen()} className={`p-2 rounded-full ${btnHover}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <ProgressBar current={currentPage} total={totalPages} onClick={goTo} style={variantCfg.progressStyle} />

      {/* CONTENT */}
      <div
        ref={contentRef}
        className={`flex-1 overflow-auto flex items-center justify-center ${
          readMode === "continu" ? "p-0 items-start" : ""
        } ${bgContent}`}
        style={{
          touchAction: readMode === "continu" ? "pan-x pan-y pinch-zoom"
                     : zoom > 1             ? "none"
                                            : "pan-y pinch-zoom",
          cursor: readMode !== "continu" && zoom > 1
                    ? (panDragRef.current.active ? "grabbing" : "grab")
                    : "default",
          userSelect: "none",
        }}
        onMouseDown={readMode !== "continu" ? handleMouseDown : undefined}
        onMouseMove={readMode !== "continu" ? handleMouseMove : undefined}
        onMouseUp={readMode !== "continu" ? handleMouseUp : undefined}
        onMouseLeave={readMode !== "continu" ? handleMouseUp : undefined}
        onClick={(e) => {
          if (readMode === "continu") return;
          if (zoom > 1) return;
          if ((e.target as HTMLElement).closest("button,a,select")) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const rel  = (e.clientX - rect.left) / rect.width;
          if (rel < 0.5) goBack();
          else goNext();
        }}
      >
        {readMode === "continu" ? (
          <div style={{ width: zoom === 1 ? "100%" : `${zoom * 100}%`, margin: "0 auto" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <img key={p} src={guestImgUrl(token, p)} alt={`Page ${p}`}
                className="w-full block" loading={p <= 3 ? "eager" : "lazy"} draggable={false} />
            ))}
          </div>
        ) : (
          <div
            className="relative flex justify-center w-full min-h-full"
            style={{
              alignItems: zoom > 1 ? "flex-start" : "flex-end",
              paddingBottom: zoom > 1 ? 0 : "2vh",
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: panDragRef.current.active ? "none" : "transform 0.1s ease-out",
            }}
          >
            {isMobile ? (
              /* Mobile : page unique pleine largeur */
              <img
                key={`mob-${rightPage}`}
                src={guestImgUrl(token, rightPage)}
                alt={`Page ${rightPage}`}
                className="rounded-sm shadow-2xl block"
                style={{
                  maxWidth: `calc(92vw * ${zoom})`,
                  maxHeight: `calc((92vh - 60px) * ${zoom})`,
                  width: "auto", height: "auto",
                }}
                draggable={false}
              />
            ) : (
              /* Desktop : double-page spread */
              <div className="flex items-end justify-center" style={{ width: "100%" }}>
                <div className="flex items-end justify-end" style={{ width: "calc(50% - 4px)" }}>
                  {(flipState ? flipState.bgLeft : leftPage) != null ? (
                    <img
                      key={`left-${flipState ? flipState.bgLeft : leftPage}`}
                      src={guestImgUrl(token, (flipState ? flipState.bgLeft : leftPage)!)}
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

                <div className="shrink-0 self-stretch" style={{
                  width: "8px",
                  background: "linear-gradient(to right, rgba(0,0,0,0.18), rgba(255,255,255,0.7) 50%, rgba(0,0,0,0.15))",
                  boxShadow: "inset 0 0 6px rgba(0,0,0,0.12)",
                }} />

                <div className="flex items-end justify-start" style={{ width: "calc(50% - 4px)" }}>
                  {(flipState ? flipState.bgRight : rightPage) != null ? (
                    <img
                      key={`right-${flipState ? flipState.bgRight : rightPage}`}
                      src={guestImgUrl(token, (flipState ? flipState.bgRight : rightPage)!)}
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
            )}

            {/* FLIP 3D */}
            {flipState && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ perspective: isMobile ? "90vw" : "70vw" }}
              >
                {/* Ombre portée */}
                <div style={{
                  position: "absolute", top: 0, bottom: 0,
                  width: isMobile ? "100%" : "calc(50% - 4px)",
                  ...(!isMobile && (flipState.dir === "fwd" ? { right: 0 } : { left: 0 })),
                  background: "rgba(0,0,0,0.18)",
                  animation: "guestCastShadow 700ms ease-in-out forwards",
                  borderRadius: "2px",
                }} />

                {/* Carte principale */}
                <div style={{
                  position: "absolute", top: 0, bottom: 0,
                  width: isMobile ? "100%" : "calc(50% - 4px)",
                  ...(!isMobile && (flipState.dir === "fwd" ? { right: 0 } : { left: 0 })),
                  ...(flipState.dir === "fwd"
                    ? { transformOrigin: "left bottom" }
                    : { transformOrigin: "right bottom" }
                  ),
                  transformStyle: "preserve-3d",
                  animation: `guestFlip${flipState.dir === "fwd" ? "Fwd" : "Bwd"} 700ms cubic-bezier(0.45, 0, 0.55, 1) forwards`,
                }}>
                  {/* Face AVANT */}
                  <div className="absolute inset-0 flex items-end" style={{
                    justifyContent: isMobile ? "center" : (flipState.dir === "fwd" ? "flex-start" : "flex-end"),
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}>
                    <img
                      src={guestImgUrl(token, flipState.frontPage)} alt=""
                      style={{
                        maxWidth: isMobile ? `calc(92vw * ${zoom})` : `calc((50vw - 8px) * ${zoom})`,
                        maxHeight: `calc((96vh - 60px) * ${zoom})`,
                        width: "auto", height: "auto",
                      }}
                      className="shadow-2xl" draggable={false}
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: flipState.dir === "fwd"
                        ? "linear-gradient(to left, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)"
                        : "linear-gradient(to right, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 60%, transparent 100%)",
                      animation: "guestCurlShadow 700ms ease-in-out forwards",
                    }} />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: flipState.dir === "fwd"
                        ? "linear-gradient(to right, transparent 55%, rgba(255,255,255,0.18) 65%, transparent 75%)"
                        : "linear-gradient(to left, transparent 55%, rgba(255,255,255,0.18) 65%, transparent 75%)",
                      animation: "guestFoldHighlight 700ms ease-in-out forwards",
                    }} />
                  </div>

                  {/* Face ARRIÈRE */}
                  <div className="absolute inset-0 flex items-end" style={{
                    justifyContent: isMobile ? "center" : (flipState.dir === "fwd" ? "flex-start" : "flex-end"),
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}>
                    <img
                      src={guestImgUrl(token, flipState.backPage)} alt=""
                      style={{
                        maxWidth: isMobile ? `calc(92vw * ${zoom})` : `calc((50vw - 8px) * ${zoom})`,
                        maxHeight: `calc((96vh - 60px) * ${zoom})`,
                        width: "auto", height: "auto",
                        transform: "scaleX(-1)",
                      }}
                      className="shadow-2xl" draggable={false}
                    />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: "rgba(0,0,0,0.25)",
                      animation: "guestLandShadow 700ms ease-in-out forwards",
                      transform: "scaleX(-1)",
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PANELS */}
      {showThumbnails && (
        <ThumbnailPanel
          token={token} edition={edition} current={currentPage}
          onSelect={goTo} onClose={() => setShowThumbnails(false)}
          theme={theme} variantCfg={variantCfg}
        />
      )}
      {toast && <Toast msg={toast} onHide={() => setToast(null)} />}

      {/* MOBILE MENU DRAWER */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl p-5 pb-8 sm:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">MODE DE LECTURE</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => { setReadMode("continu"); setShowMobileMenu(false); }}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  readMode === "continu" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="1.5"/>
                  <line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/>
                  <line x1="7" y1="16" x2="13" y2="16"/>
                </svg>
                Continu
              </button>
              <button onClick={() => { setReadMode("livre"); setShowMobileMenu(false); }}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  readMode === "livre" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/>
                </svg>
                Livre
              </button>
            </div>
            <p className="text-xs font-bold tracking-widest text-gray-400 mb-3">ZOOM</p>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg">−</button>
              <span className="w-16 text-center text-sm font-semibold text-gray-900">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-lg">+</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setShowThumbnails(true); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Miniatures
              </button>
              <button onClick={() => { containerRef.current?.requestFullscreen(); setShowMobileMenu(false); }}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Plein écran
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes guest-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .animate-guest-fade-in { animation: guest-fade-in 0.2s ease-out; }

        @keyframes guestFlipFwd  { 0% { transform: rotateY(0deg);    } 100% { transform: rotateY(-180deg); } }
        @keyframes guestFlipBwd  { 0% { transform: rotateY(0deg);    } 100% { transform: rotateY(180deg);  } }
        @keyframes guestCastShadow    { 0%, 100% { opacity: 0; } 15%, 85% { opacity: 1; } }
        @keyframes guestCurlShadow    { 0% { opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes guestFoldHighlight { 0% { opacity: 0; } 20% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 0; } }
        @keyframes guestLandShadow    { 0% { opacity: 0.8; } 70% { opacity: 0.8; } 100% { opacity: 0; } }
      `}</style>
    </div>
  );
}
