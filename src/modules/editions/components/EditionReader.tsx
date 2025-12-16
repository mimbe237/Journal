"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ButtonSecondary } from "@/components/ui/Button";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Edition {
  id: string;
  titre: string;
  nombrePages: number;
}

interface EditionReaderProps {
  editionId: string;
}

type FetchState = "idle" | "loading" | "success" | "error";
type ViewMode = "single" | "double" | "flip";
type ThemeMode = "light" | "dark" | "sepia";
type FlipDirection = "none" | "next" | "prev";

interface Bookmark {
  page: number;
  createdAt: number;
  note?: string;
}

interface ReadingProgress {
  editionId: string;
  currentPage: number;
  lastRead: number;
  totalReadingTime: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;
const PRELOAD_PAGES = 3;
const AVG_SECONDS_PER_PAGE = 45;

// ============================================================================
// HOOKS
// ============================================================================

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
    }
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (e) {
        console.warn(`Error setting localStorage key "${key}":`, e);
      }
      return newValue;
    });
  }, [key]);

  return [storedValue, setValue];
}

function useReadingTime(editionId: string) {
  const [progress, setProgress] = useLocalStorage<ReadingProgress | null>(
    `reading-progress-${editionId}`,
    null
  );
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const sessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setProgress((prev) => ({
        editionId,
        currentPage: prev?.currentPage ?? 1,
        lastRead: Date.now(),
        totalReadingTime: (prev?.totalReadingTime ?? 0) + 1,
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [editionId, setProgress]);

  const updatePage = useCallback((page: number) => {
    setProgress((prev) => ({
      editionId,
      currentPage: page,
      lastRead: Date.now(),
      totalReadingTime: prev?.totalReadingTime ?? 0,
    }));
  }, [editionId, setProgress]);

  return { progress, updatePage };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function getImageUrl(editionId: string, page: number): string {
  return `/api/editions/${editionId}/pages/${page}/image`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Progress Bar
function ProgressBar({ current, total, onPageClick }: { current: number; total: number; onPageClick: (page: number) => void }) {
  const percentage = (current / total) * 100;
  
  return (
    <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const page = Math.ceil((x / rect.width) * total);
        onPageClick(Math.max(1, Math.min(total, page)));
      }}
    >
      <div 
        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none">
        {current} / {total}
      </div>
    </div>
  );
}

// Thumbnail Panel
function ThumbnailPanel({ 
  editionId, 
  total, 
  current, 
  onSelect, 
  bookmarks,
  isOpen,
  onClose 
}: { 
  editionId: string; 
  total: number; 
  current: number; 
  onSelect: (page: number) => void;
  bookmarks: Bookmark[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const currentThumbRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && currentThumbRef.current) {
      currentThumbRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isOpen, current]);

  if (!isOpen) return null;

  const bookmarkedPages = new Set(bookmarks.map(b => b.page));

  return (
    <div 
      ref={panelRef}
      className="absolute left-0 top-0 bottom-0 w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl z-40 overflow-y-auto"
    >
      <div className="sticky top-0 bg-white dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pages</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            ref={page === current ? currentThumbRef : null}
            onClick={() => { onSelect(page); onClose(); }}
            className={`relative aspect-[3/4] rounded overflow-hidden border-2 transition-all ${
              page === current 
                ? "border-blue-500 ring-2 ring-blue-200" 
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <img 
              src={getImageUrl(editionId, page)} 
              alt={`Page ${page}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 text-center">
              {page}
            </div>
            {bookmarkedPages.has(page) && (
              <div className="absolute top-1 right-1 text-yellow-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Go To Page Dialog
function GoToPageDialog({ 
  isOpen, 
  onClose, 
  onGo, 
  total, 
  current 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onGo: (page: number) => void; 
  total: number;
  current: number;
}) {
  const [value, setValue] = useState(current.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(current.toString());
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, current]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(value);
    if (page >= 1 && page <= total) {
      onGo(page);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <form 
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-72"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Aller à la page</h3>
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={total}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder={`1 - ${total}`}
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            Annuler
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Aller
          </button>
        </div>
      </form>
    </div>
  );
}

// Bookmarks Panel
function BookmarksPanel({
  bookmarks,
  onSelect,
  onRemove,
  isOpen,
  onClose
}: {
  bookmarks: Bookmark[];
  onSelect: (page: number) => void;
  onRemove: (page: number) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="font-medium text-gray-900 dark:text-white">Marque-pages</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {bookmarks.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          Aucun marque-page
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {bookmarks.sort((a, b) => a.page - b.page).map((bookmark) => (
            <div 
              key={bookmark.page}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
              onClick={() => { onSelect(bookmark.page); onClose(); }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
                <span className="text-gray-900 dark:text-white">Page {bookmark.page}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(bookmark.page); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Panel
function SettingsPanel({
  theme,
  setTheme,
  viewMode,
  setViewMode,
  isOpen,
  onClose
}: {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      <div className="absolute right-6 top-20 w-72 max-h-[80vh] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 pointer-events-auto">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="font-medium text-gray-900 dark:text-white">Paramètres</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 space-y-4">
        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thème</label>
          <div className="flex gap-2">
            {[
              { value: "light", label: "Clair", icon: "☀️" },
              { value: "dark", label: "Sombre", icon: "🌙" },
              { value: "sepia", label: "Sépia", icon: "📜" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value as ThemeMode)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  theme === opt.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className="block text-lg mb-1">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode d'affichage</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("flip")}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === "flip"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              📖 Feuilleter
            </button>
            <button
              onClick={() => setViewMode("single")}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === "single"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Simple
            </button>
            <button
              onClick={() => setViewMode("double")}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === "double"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              Double
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// Control Button
function ControlButton({ 
  onClick, 
  title, 
  children, 
  active = false,
  disabled = false 
}: { 
  onClick: () => void; 
  title: string; 
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        disabled 
          ? "opacity-40 cursor-not-allowed"
          : active
            ? "bg-blue-500 text-white"
            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

// Skeleton Loader
function PageSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full max-w-2xl aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EditionReader({ editionId }: EditionReaderProps) {
  // Edition data
  const [edition, setEdition] = useState<Edition | null>(null);
  const [editionLoading, setEditionLoading] = useState(true);
  const [editionError, setEditionError] = useState<string | null>(null);

  // Core state
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchState, setFetchState] = useState<FetchState>("idle");
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);

  // UI state
  const [theme, setTheme] = useLocalStorage<ThemeMode>(`reader-theme`, "dark");
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(`reader-viewmode`, "flip");
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [flipDirection, setFlipDirection] = useState<FlipDirection>("none");
  const [isFlipping, setIsFlipping] = useState(false);
  const [showGoToPage, setShowGoToPage] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Bookmarks
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(`bookmarks-${editionId}`, []);

  // Reading progress
  const { progress, updatePage } = useReadingTime(editionId);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const totalPages = edition?.nombrePages ?? 0;

  // Fetch edition data
  useEffect(() => {
    async function fetchEdition() {
      try {
        setEditionLoading(true);
        const res = await fetch(`/api/editions/${editionId}`);
        if (!res.ok) {
          if (res.status === 401) {
            setEditionError("Vous devez être connecté pour accéder à cette édition.");
          } else if (res.status === 403) {
            setEditionError("Vous n'avez pas accès à cette édition. Un abonnement actif est requis.");
          } else {
            setEditionError("Impossible de charger l'édition.");
          }
          return;
        }
        const data = await res.json();
        setEdition(data.edition);
      } catch (e) {
        setEditionError("Erreur de connexion.");
      } finally {
        setEditionLoading(false);
      }
    }
    fetchEdition();
  }, [editionId]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Restore reading position
  useEffect(() => {
    if (progress?.currentPage && progress.currentPage > 1) {
      setCurrentPage(progress.currentPage);
    }
  }, []);

  // Update reading progress
  useEffect(() => {
    updatePage(currentPage);
  }, [currentPage, updatePage]);

  // Preload images
  useEffect(() => {
    const pagesToPreload = [];
    for (let i = 1; i <= PRELOAD_PAGES; i++) {
      if (currentPage + i <= totalPages) pagesToPreload.push(currentPage + i);
      if (currentPage - i >= 1) pagesToPreload.push(currentPage - i);
    }

    pagesToPreload.forEach((page) => {
      if (!loadedImages.has(page)) {
        const img = new Image();
        img.src = getImageUrl(editionId, page);
        img.onload = () => setLoadedImages((prev) => new Set(prev).add(page));
      }
    });
  }, [currentPage, editionId, totalPages, loadedImages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGoToPage || isFlipping) return;

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          if (currentPage < totalPages) {
            if (viewMode === "flip") {
              setFlipDirection("next");
              setIsFlipping(true);
              setTimeout(() => {
                setCurrentPage((p) => p + 1);
                setFlipDirection("none");
                setIsFlipping(false);
              }, 600);
            } else {
              setCurrentPage((p) => p + 1);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (currentPage > 1) {
            if (viewMode === "flip") {
              setFlipDirection("prev");
              setIsFlipping(true);
              setTimeout(() => {
                setCurrentPage((p) => p - 1);
                setFlipDirection("none");
                setIsFlipping(false);
              }, 600);
            } else {
              setCurrentPage((p) => p - 1);
            }
          }
          break;
        case "Home":
          e.preventDefault();
          setCurrentPage(1);
          break;
        case "End":
          e.preventDefault();
          setCurrentPage(totalPages);
          break;
        case "f":
          e.preventDefault();
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        case "g":
          e.preventDefault();
          setShowGoToPage(true);
          break;
        case "b":
          e.preventDefault();
          // Toggle bookmark
          const exists = bookmarks.find((b) => b.page === currentPage);
          if (exists) {
            setBookmarks((prev) => prev.filter((b) => b.page !== currentPage));
          } else {
            setBookmarks((prev) => [...prev, { page: currentPage, createdAt: Date.now() }]);
          }
          break;
        case "t":
          e.preventDefault();
          setShowThumbnails((v) => !v);
          break;
        case "+":
        case "=":
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
        case "r":
          e.preventDefault();
          setRotation((r) => (r + 90) % 360);
          break;
        case "Escape":
          setShowThumbnails(false);
          setShowBookmarks(false);
          setShowSettings(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, showGoToPage, isFlipping, viewMode, bookmarks, setBookmarks]);

  // Fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (isFullscreen) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isFullscreen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && !isFlipping) {
      setCurrentPage(page);
      setFetchState("loading");
    }
  }, [totalPages, isFlipping]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages && !isFlipping) {
      if (viewMode === "flip") {
        setFlipDirection("next");
        setIsFlipping(true);
        setTimeout(() => {
          setCurrentPage((p) => p + 1);
          setFlipDirection("none");
          setIsFlipping(false);
        }, 600);
      } else {
        setCurrentPage((p) => p + 1);
      }
    }
  }, [currentPage, totalPages, isFlipping, viewMode]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1 && !isFlipping) {
      if (viewMode === "flip") {
        setFlipDirection("prev");
        setIsFlipping(true);
        setTimeout(() => {
          setCurrentPage((p) => p - 1);
          setFlipDirection("none");
          setIsFlipping(false);
        }, 600);
      } else {
        setCurrentPage((p) => p - 1);
      }
    }
  }, [currentPage, isFlipping, viewMode]);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  const toggleBookmark = useCallback(() => {
    const exists = bookmarks.find((b) => b.page === currentPage);
    if (exists) {
      setBookmarks((prev) => prev.filter((b) => b.page !== currentPage));
    } else {
      setBookmarks((prev) => [...prev, { page: currentPage, createdAt: Date.now() }]);
    }
  }, [bookmarks, currentPage, setBookmarks]);

  const handleImageLoad = useCallback(() => {
    setFetchState("success");
    setLoadedImages((prev) => new Set(prev).add(currentPage));
  }, [currentPage]);

  const handleImageError = useCallback(() => {
    setFetchState("error");
  }, []);

  // Touch handlers for swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || isFlipping) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Swipe detection
    if (deltaTime < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
      if (deltaX > 0) {
        goToPrevPage();
      } else if (deltaX < 0) {
        goToNextPage();
      }
    }

    touchStartRef.current = null;
  }, [isFlipping, goToNextPage, goToPrevPage]);

  const handleDownloadPage = useCallback(async () => {
    if (!edition) return;
    try {
      const response = await fetch(getImageUrl(editionId, currentPage));
      const blob = await response.blob();
      const contentType = response.headers.get("Content-Type") ?? "";
      const extension = contentType.includes("webp")
        ? "webp"
        : contentType.includes("png")
          ? "png"
          : "img";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${edition.titre}-page-${currentPage}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
    }
  }, [editionId, edition, currentPage]);

  const handleSharePage = useCallback(() => {
    if (!edition) return;
    const url = `${window.location.origin}/editions/${editionId}?page=${currentPage}`;
    if (navigator.share) {
      navigator.share({ title: edition.titre, url });
    } else {
      navigator.clipboard.writeText(url);
      // Could show a toast here
    }
  }, [editionId, edition, currentPage]);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const isCurrentPageBookmarked = useMemo(
    () => bookmarks.some((b) => b.page === currentPage),
    [bookmarks, currentPage]
  );

  const remainingTime = useMemo(() => {
    const remainingPages = totalPages - currentPage;
    return remainingPages * AVG_SECONDS_PER_PAGE;
  }, [currentPage, totalPages]);

  const themeClasses = useMemo(() => {
    switch (theme) {
      case "light":
        return "bg-gray-100 text-gray-900";
      case "sepia":
        return "bg-amber-50 text-amber-900";
      case "dark":
      default:
        return "bg-gray-900 text-gray-100";
    }
  }, [theme]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading state
  if (editionLoading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Chargement de l'édition...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (editionError || !edition) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4 p-8 bg-red-900/20 rounded-lg max-w-md text-center">
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400">{editionError || "Édition introuvable"}</p>
          <a href="/editions" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Retour au kiosque
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden transition-colors duration-300 ${themeClasses}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Thumbnail Panel */}
      <ThumbnailPanel
        editionId={editionId}
        total={totalPages}
        current={currentPage}
        onSelect={goToPage}
        bookmarks={bookmarks}
        isOpen={showThumbnails}
        onClose={() => setShowThumbnails(false)}
      />

      {/* Top Controls */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b transition-all duration-300 ${
          theme === "dark" 
            ? "bg-gray-800/90 border-gray-700" 
            : theme === "sepia"
              ? "bg-amber-100/90 border-amber-200"
              : "bg-white/90 border-gray-200"
        } backdrop-blur-sm ${
          showControls || !isFullscreen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        {/* Left controls */}
        <div className="flex items-center gap-1">
          <ControlButton onClick={() => setShowThumbnails((v) => !v)} title="Miniatures (T)" active={showThumbnails}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </ControlButton>
          
          <ControlButton onClick={() => setShowGoToPage(true)} title="Aller à la page (G)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </ControlButton>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          <ControlButton onClick={handleZoomOut} title="Zoom -" disabled={zoom <= ZOOM_MIN}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </ControlButton>
          
          <span className="text-sm font-medium min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
          
          <ControlButton onClick={handleZoomIn} title="Zoom +" disabled={zoom >= ZOOM_MAX}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </ControlButton>

          <ControlButton onClick={() => setRotation((r) => (r + 90) % 360)} title="Rotation (R)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </ControlButton>
        </div>

        {/* Center - Page info */}
        <div className="flex items-center gap-3">
          <button 
            onClick={goToPrevPage} 
            disabled={currentPage <= 1 || isFlipping}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium">
            Page {currentPage} / {totalPages}
          </span>
          <button 
            onClick={goToNextPage} 
            disabled={currentPage >= totalPages || isFlipping}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-40"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 relative">
          <ControlButton onClick={toggleBookmark} title="Marque-page (B)" active={isCurrentPageBookmarked}>
            <svg className="w-5 h-5" fill={isCurrentPageBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </ControlButton>

          <ControlButton onClick={() => setShowBookmarks((v) => !v)} title="Voir marque-pages" active={showBookmarks}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </ControlButton>

          <BookmarksPanel
            bookmarks={bookmarks}
            onSelect={goToPage}
            onRemove={(page) => setBookmarks((prev) => prev.filter((b) => b.page !== page))}
            isOpen={showBookmarks}
            onClose={() => setShowBookmarks(false)}
          />

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          <ControlButton onClick={handleSharePage} title="Partager page">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </ControlButton>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

          <ControlButton onClick={toggleFullscreen} title="Plein écran (F)">
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </ControlButton>

          <ControlButton onClick={() => setShowSettings((v) => !v)} title="Paramètres" active={showSettings}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </ControlButton>

          <SettingsPanel
            theme={theme}
            setTheme={setTheme}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className={`px-4 py-1 ${theme === "dark" ? "bg-gray-800" : theme === "sepia" ? "bg-amber-100" : "bg-white"}`}>
        <ProgressBar current={currentPage} total={totalPages} onPageClick={goToPage} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        >
          {fetchState === "loading" && <PageSkeleton />}
          
          {viewMode === "flip" ? (
            /* Mode feuilletage - Book-like flip animation */
            <div className="flip-book-container perspective-1500">
              <div className="relative flex">
                {/* Page gauche (précédente ou page courante si page 1) */}
                <div className="page-left relative">
                  {currentPage > 1 ? (
                    <img
                      src={getImageUrl(editionId, currentPage - 1)}
                      alt={`Page ${currentPage - 1}`}
                      className="max-h-[calc(100vh-12rem)] w-auto shadow-xl rounded-l-sm"
                      style={{ maxWidth: "45vw" }}
                      draggable={false}
                    />
                  ) : (
                    /* Page 1: afficher la une à gauche aussi */
                    <img
                      src={getImageUrl(editionId, 1)}
                      alt="Page 1"
                      className="max-h-[calc(100vh-12rem)] w-auto shadow-xl rounded-l-sm opacity-30"
                      style={{ maxWidth: "45vw" }}
                      draggable={false}
                    />
                  )}
                </div>

                {/* Page qui tourne */}
                <div 
                  className={`page-flip absolute left-1/2 origin-left ${
                    isFlipping ? (flipDirection === "next" ? "animate-flip-next" : "animate-flip-prev") : ""
                  }`}
                  style={{ 
                    transformStyle: "preserve-3d",
                    zIndex: isFlipping ? 10 : 1
                  }}
                >
                  {isFlipping && (
                    <>
                      {/* Face avant de la page qui tourne */}
                      <div className="page-front absolute inset-0 backface-hidden">
                        <img
                          src={getImageUrl(editionId, flipDirection === "next" ? currentPage : currentPage - 1)}
                          alt="Page tournante"
                          className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl"
                          style={{ maxWidth: "45vw" }}
                          draggable={false}
                        />
                      </div>
                      {/* Face arrière de la page qui tourne */}
                      <div className="page-back absolute inset-0 backface-hidden rotate-y-180">
                        <img
                          src={getImageUrl(editionId, flipDirection === "next" ? currentPage + 1 : currentPage)}
                          alt="Page tournante verso"
                          className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl"
                          style={{ maxWidth: "45vw", transform: "scaleX(-1)" }}
                          draggable={false}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Page droite (actuelle) */}
                <div className="page-right relative">
                  <img
                    ref={imageRef}
                    src={getImageUrl(editionId, currentPage)}
                    alt={`Page ${currentPage}`}
                    className={`max-h-[calc(100vh-12rem)] w-auto shadow-xl rounded-r-sm transition-opacity duration-300 ${
                      isFlipping ? "opacity-50" : "opacity-100"
                    }`}
                    style={{ maxWidth: "45vw" }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    draggable={false}
                  />
                  {/* Zone cliquable pour page suivante */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage >= totalPages || isFlipping}
                    className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/10 to-transparent disabled:cursor-default disabled:opacity-0"
                    aria-label="Page suivante"
                  />
                  {/* Zone cliquable pour page précédente */}
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1 || isFlipping}
                    className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/10 to-transparent disabled:cursor-default disabled:opacity-0"
                    aria-label="Page précédente"
                  />
                </div>
              </div>
              {/* Reliure centrale */}
              <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 shadow-inner" />
            </div>
          ) : viewMode === "single" ? (
            <img
              ref={imageRef}
              src={getImageUrl(editionId, currentPage)}
              alt={`Page ${currentPage}`}
              className={`max-h-[calc(100vh-12rem)] w-auto shadow-2xl rounded-sm transition-opacity duration-300 ${
                fetchState === "loading" ? "opacity-0" : "opacity-100"
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
            />
          ) : (
            <div className="flex gap-1">
              {currentPage > 1 && (
                <img
                  src={getImageUrl(editionId, currentPage - 1)}
                  alt={`Page ${currentPage - 1}`}
                  className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl rounded-sm"
                  draggable={false}
                />
              )}
              <img
                ref={imageRef}
                src={getImageUrl(editionId, currentPage)}
                alt={`Page ${currentPage}`}
                className="max-h-[calc(100vh-12rem)] w-auto shadow-2xl rounded-sm"
                onLoad={handleImageLoad}
                onError={handleImageError}
                draggable={false}
              />
            </div>
          )}

          {fetchState === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-600 dark:text-red-400">Impossible de charger la page</p>
              <ButtonSecondary onClick={() => { setFetchState("loading"); }}>
                Réessayer
              </ButtonSecondary>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info bar */}
      <div
        className={`flex items-center justify-between px-4 py-2 text-xs border-t transition-all duration-300 ${
          theme === "dark"
            ? "bg-gray-800/90 border-gray-700 text-gray-400"
            : theme === "sepia"
              ? "bg-amber-100/90 border-amber-200 text-amber-700"
              : "bg-white/90 border-gray-200 text-gray-500"
        } backdrop-blur-sm ${
          showControls || !isFullscreen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="flex items-center gap-4">
          <span>⏱ Temps restant: ~{formatTime(remainingTime)}</span>
          {progress?.totalReadingTime ? (
            <span>📖 Lu: {formatTime(progress.totalReadingTime * 60)}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <span>← → Naviguer</span>
          <span>+/- Zoom</span>
          <span>F Plein écran</span>
          <span>B Marque-page</span>
        </div>
      </div>

      {/* Go To Page Dialog */}
      <GoToPageDialog
        isOpen={showGoToPage}
        onClose={() => setShowGoToPage(false)}
        onGo={goToPage}
        total={totalPages}
        current={currentPage}
      />

      {/* CSS for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        
        /* Page flip animations */
        .perspective-1500 {
          perspective: 1500px;
        }
        
        .backface-hidden {
          backface-visibility: hidden;
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        
        @keyframes flipNext {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(-180deg);
          }
        }
        
        @keyframes flipPrev {
          0% {
            transform: rotateY(-180deg);
          }
          100% {
            transform: rotateY(0deg);
          }
        }
        
        .animate-flip-next {
          animation: flipNext 0.6s ease-in-out forwards;
        }
        
        .animate-flip-prev {
          animation: flipPrev 0.6s ease-in-out forwards;
        }
        
        .page-flip {
          transform-style: preserve-3d;
        }
        
        .page-front, .page-back {
          backface-visibility: hidden;
        }
        
        .page-back {
          transform: rotateY(180deg);
        }
        
        .flip-book-container {
          user-select: none;
        }
      `}</style>
    </div>
  );
}
