"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";

type MappingKey =
  | "nom"
  | "email"
  | "telephone"
  | "pays"
  | "enterpriseName"
  | "dateDebut"
  | "dateFin"
  | "statut";

const requiredFields: MappingKey[] = ["nom", "email", "dateDebut", "dateFin"];
const optionalFields: MappingKey[] = ["telephone", "pays", "enterpriseName", "statut"];

type ParsedRow = Partial<Record<MappingKey, string>>;

export function ImportSubscribersModal() {
  const [open, setOpen] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<MappingKey, string>>({
    nom: "",
    email: "",
    dateDebut: "",
    dateFin: "",
    telephone: "",
    pays: "",
    enterpriseName: "",
    statut: ""
  });
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allMapped = useMemo(
    () => requiredFields.every((f) => mapping[f]),
    [mapping]
  );

  const handleFile = async (file: File | null) => {
    setError(null);
    setSuccess(null);
    setRows([]);
    if (!file) return;
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setError("Le fichier doit contenir un header et au moins une ligne.");
      return;
    }
    const delimiter = lines[0].includes(";") ? ";" : ",";
    const headerList = lines[0].split(delimiter).map((h) => h.trim());
    setHeaders(headerList);
    const parsed: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.trim());
      const row: ParsedRow = {};
      headerList.forEach((h, idx) => {
        row[h as MappingKey] = cols[idx] ?? "";
      });
      parsed.push(row);
    }
    setRows(parsed);
  };

  const remapRows = (): ParsedRow[] => {
    return rows.map((r) => {
      const mapped: ParsedRow = {};
      (Object.keys(mapping) as MappingKey[]).forEach((key) => {
        const src = mapping[key];
        if (src) mapped[key] = (r as any)[src] ?? "";
      });
      return mapped;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!allMapped) {
      setError("Mappez tous les champs obligatoires avant d'importer.");
      return;
    }
    const payload = remapRows().filter((r) => r.email && r.nom);
    if (!payload.length) {
      setError("Aucune ligne valide après mapping.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscribers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Import échoué");
      setSuccess(`Import terminé : ${json.created} créés, ${json.skipped} ignorés, ${json.errors?.length || 0} erreurs.`);
    } catch (err: any) {
      setError(err?.message || "Import échoué");
    } finally {
      setLoading(false);
    }
  };

  const fieldLabel: Record<MappingKey, string> = {
    nom: "Nom complet*",
    email: "Email*",
    telephone: "Téléphone",
    pays: "Pays",
    enterpriseName: "Entreprise (nom)",
    dateDebut: "Date début*",
    dateFin: "Date expiration*",
    statut: "Statut (ACTIF/EXPIRE/SUSPENDU)"
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Importer des abonnés</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Import abonnés (CSV)</h2>
                <p className="text-sm text-slate-500">Mapping des colonnes et import en masse (Super Admin)</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="space-y-6 px-6 py-5">
              {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Fichier CSV</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
                <p className="text-xs text-slate-500">Délimiteur virgule ou point-virgule. Première ligne = en-têtes.</p>
              </div>

              {headers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800">Mapping des colonnes</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[...requiredFields, ...optionalFields].map((field) => (
                      <label key={field} className="text-sm text-slate-700 space-y-1">
                        <span>{fieldLabel[field]}</span>
                        <select
                          value={mapping[field]}
                          onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">-- Ignorer / non défini --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button variant="secondary" type="button" onClick={() => setOpen(false)} disabled={loading}>
                  Fermer
                </Button>
                <Button onClick={handleSubmit} disabled={!allMapped || loading || headers.length === 0}>
                  {loading ? "Import..." : "Lancer l'import"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
