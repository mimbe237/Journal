"use client";

// Boutons simples qui ouvrent les exports CSV côté admin.
export function ExportButtons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => window.open("/api/admin/export/subscribers", "_blank")}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
      >
        Exporter abonnés (CSV)
      </button>
      <button
        onClick={() => window.open("/api/admin/export/subscriptions", "_blank")}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
      >
        Exporter abonnements (CSV)
      </button>
      <button
        onClick={() => window.open("/api/admin/export/reading-stats", "_blank")}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 transition hover:bg-slate-800"
      >
        Exporter stats de lecture (CSV)
      </button>
    </div>
  );
}
