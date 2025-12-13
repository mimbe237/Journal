"use client";

import { useEffect, useState } from "react";

import { EditionCard } from "@/modules/editions/components/EditionCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/ui/States";

type EditionListItem = {
  id: string;
  titre: string;
  datePublication: string;
  type: string;
  nombrePages: number | null;
  cheminImageUne?: string | null;
};

export default function EditionsKioskPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<EditionListItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/editions?page=1&pageSize=12", {
          cache: "no-store",
          credentials: "include"
        });
        const raw = await res.text();
        let json: any = null;
        try {
          json = raw ? JSON.parse(raw) : null;
        } catch {
          // Réponse non JSON (ex: redirection HTML)
        }
        if (!res.ok) {
          const message = json?.error || raw || "Impossible de charger les éditions";
          throw new Error(message);
        }
        if (cancelled) return;
        setEditions(json?.data ?? []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <PageHeader title="Kiosque numérique" subtitle="Consultez les dernières éditions du journal." />

        {loading && <LoadingState message="Chargement des éditions..." />}
        {error && <ErrorState message={error} />}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {editions.map((edition) => (
              <EditionCard key={edition.id} {...edition} />
            ))}
            {editions.length === 0 && <ErrorState message="Aucune édition disponible pour le moment." />}
          </div>
        )}
      </div>
    </div>
  );
}
