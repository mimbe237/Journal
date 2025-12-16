"use client";

import Link from "next/link";

export function ExportButtons() {
  const btn =
    "rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-slate-500";

  return (
    <div className="flex flex-wrap gap-3">
      <Link className={btn} href="/api/admin/export/subscribers">
        Exporter abonnés (CSV)
      </Link>
      <Link className={btn} href="/api/admin/export/subscriptions">
        Exporter abonnements (CSV)
      </Link>
      <Link className={btn} href="/api/admin/export/reading-stats">
        Exporter stats de lecture (CSV)
      </Link>
    </div>
  );
}
