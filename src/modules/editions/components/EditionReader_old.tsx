"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ButtonSecondary } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/States";

type EditionMeta = {
  id: string;
  titre: string;
  datePublication: string;
  type: string;
  nombrePages: number | null;
};

type FetchState<T> =
  | { status: "idle" | "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.75;
const ZOOM_MAX = 2.5;

function getPageImageUrl(editionId: string, pageNumber: number): string {
  return `/api/editions/${editionId}/pages/${pageNumber}/image`;
}

type ControlsProps = {
  currentPage: number;
  totalPages: number | null;
  zoom: number;
  isFullscreen: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
};

// Barre de contrôle du lecteur (navigation, zoom, plein écran).
function EditionReaderControls({
  currentPage,
  totalPages,
  zoom,
  isFullscreen,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onToggleFullscreen
}: ControlsProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <ButtonSecondary onClick={onPrev} disabled={!canGoPrev} aria-label="Page précédente">
          ← Page précédente
        </ButtonSecondary>
        <ButtonSecondary onClick={onNext} disabled={!canGoNext} aria-label="Page suivante">
          Page suivante →
        </ButtonSecondary>
        {/* TODO: Ajouter boutons première/dernière page si utile */}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-100">
          <button
            className="rounded bg-slate-700 px-2 py-1 transition hover:bg-slate-600"
            onClick={onZoomOut}
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
          <button
            className="rounded bg-slate-700 px-2 py-1 transition hover:bg-slate-600"
            onClick={onZoomIn}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <button
          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? "Quitter plein écran" : "Plein écran"}
        </button>

        <div className="rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200">
          Page {currentPage}
          {totalPages ? ` / ${totalPages}` : ""}
        </div>
      </div>
    </div>
  );
}

export function EditionReader({ editionId, initialPage = 1 }: { editionId: string; initialPage?: number }) {
  const [edition, setEdition] = useState<FetchState<EditionMeta>>({ status: "idle" });
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Charger les métadonnées de l'édition
  useEffect(() => {
    let cancelled = false;

    const editionIdToFetch = editionId?.trim();
    if (!editionIdToFetch) {
      setEdition({ status: "error", error: "Identifiant d'édition manquant" });
      setTotalPages(null);
      return () => {
        cancelled = true;
      };
    }

    async function loadEdition() {
      setEdition({ status: "loading" });
      try {
        const res = await fetch(`/api/editions/${editionIdToFetch}`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Impossible de charger l'édition");
        if (cancelled) return;
        const meta = json.edition as EditionMeta;
        setEdition({ status: "success", data: meta });
        setTotalPages(meta.nombrePages);
      } catch (err: any) {
        if (cancelled) return;
        setEdition({ status: "error", error: err?.message ?? "Erreur de chargement" });
      }
    }
    loadEdition();
    return () => {
      cancelled = true;
    };
  }, [editionId]);

  // Préchargement de la page suivante pour fluidifier la navigation
  useEffect(() => {
    if (!totalPages || currentPage >= totalPages) return;
    const nextPage = currentPage + 1;
    const img = new Image();
    img.src = getPageImageUrl(editionId, nextPage);
  }, [currentPage, totalPages, editionId]);

  // Suivre l'état du plein écran
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const editionDate = useMemo(() => {
    if (edition.status !== "success") return "";
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(
      new Date(edition.data.datePublication)
    );
  }, [edition]);

  const canGoPrev = currentPage > 1;
  const canGoNext = totalPages ? currentPage < totalPages : true;

  function changePage(delta: number) {
    setImageError(null);
    setIsImageLoading(true);
    setCurrentPage((prev) => Math.max(1, totalPages ? Math.min(totalPages, prev + delta) : prev + delta));
  }

  function handleZoom(delta: number) {
    setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number((z + delta).toFixed(2)))));
  }

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  const imageUrl = useMemo(() => getPageImageUrl(editionId, currentPage), [editionId, currentPage]);

  const renderContent = () => {
    if (edition.status === "loading" || edition.status === "idle") {
      return <LoadingState message="Chargement de l'édition..." />;
    }
    if (edition.status === "error") {
      return <ErrorState message={edition.error} />;
    }

    return (
      <div
        ref={containerRef}
        className="relative h-[70vh] w-full overflow-auto rounded-lg border border-slate-800 bg-slate-900/50 shadow-inner shadow-black/40"
      >
        <div className="flex min-h-full w-full justify-center p-4">
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`Page ${currentPage}`}
            className="max-w-full select-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            onLoad={() => setIsImageLoading(false)}
            onError={() => {
              setIsImageLoading(false);
              setImageError("Impossible de charger l'image de cette page");
            }}
            draggable={false}
          />
        </div>
        {isImageLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm">
            <p className="text-sm text-slate-200">Chargement de la page...</p>
          </div>
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur">
            <p className="text-sm text-red-200">{imageError}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg shadow-black/30">
      {edition.status === "success" && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-300">Lecteur d'édition</p>
            <h2 className="text-xl font-semibold text-slate-50">{edition.data.titre}</h2>
            <p className="text-sm text-slate-300">
              {editionDate} · {edition.data.type} ·{" "}
              {edition.data.nombrePages ? `${edition.data.nombrePages} pages` : "nombre de pages inconnu"}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="rounded-full bg-emerald-900/30 px-3 py-1 text-emerald-200">{zoom}x</span>
            {isFullscreen && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">Plein écran</span>
            )}
          </div>
        </div>
      )}

      {renderContent()}

      <EditionReaderControls
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        isFullscreen={isFullscreen}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={() => changePage(-1)}
        onNext={() => changePage(1)}
        onZoomIn={() => handleZoom(ZOOM_STEP)}
        onZoomOut={() => handleZoom(-ZOOM_STEP)}
        onToggleFullscreen={toggleFullscreen}
      />

      <p className="text-xs text-slate-400">
        Astuce : utilisez la molette pour scroller/panner lorsque vous zoomez. TODO : gestures mobiles (swipe) et pan
        drag-and-drop.
      </p>
    </div>
  );
}

export function getEditionPageImageUrl(editionId: string, pageNumber: number) {
  return getPageImageUrl(editionId, pageNumber);
}
