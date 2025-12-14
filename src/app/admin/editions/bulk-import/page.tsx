"use client";

import { useState, useEffect } from "react";

interface PendingEdition {
  key: string;
  filename: string;
  size: number;
  lastModified: string | null;
  suggestedTitle: string;
  suggestedDate: string | null;
  existsInDb: boolean;
}

interface EditableEdition extends PendingEdition {
  title: string;
  datePublication: string;
  type: "QUOTIDIEN" | "HEBDOMADAIRE" | "SPECIAL";
  selected: boolean;
}

interface ProcessResult {
  key: string;
  success: boolean;
  editionId?: string;
  error?: string;
  pageCount?: number;
}

type Step = "guide" | "list" | "edit" | "processing" | "results";

export default function BulkImportPage() {
  const [step, setStep] = useState<Step>("guide");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editions, setEditions] = useState<EditableEdition[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchPendingEditions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bulk-import/pending");
      if (!res.ok) throw new Error("Erreur lors de la récupération des fichiers");
      const data = await res.json();
      
      const editable: EditableEdition[] = data.editions.map((e: PendingEdition) => ({
        ...e,
        title: e.suggestedTitle,
        datePublication: e.suggestedDate || new Date().toISOString().split("T")[0],
        type: "QUOTIDIEN" as const,
        selected: !e.existsInDb,
      }));
      
      setEditions(editable);
      setStep("list");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processEditions = async () => {
    const selectedEditions = editions.filter(e => e.selected);
    if (selectedEditions.length === 0) {
      setError("Veuillez sélectionner au moins une édition");
      return;
    }

    setStep("processing");
    setProgress({ current: 0, total: selectedEditions.length });
    setResults([]);
    setError(null);

    const BATCH_SIZE = 5;
    const allResults: ProcessResult[] = [];

    for (let i = 0; i < selectedEditions.length; i += BATCH_SIZE) {
      const batch = selectedEditions.slice(i, i + BATCH_SIZE);
      
      try {
        const res = await fetch("/api/admin/bulk-import/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editions: batch.map(e => ({
              key: e.key,
              title: e.title,
              datePublication: e.datePublication,
              type: e.type,
            })),
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Erreur lors du traitement");
        }

        const data = await res.json();
        allResults.push(...data.results);
        setProgress({ current: i + batch.length, total: selectedEditions.length });
      } catch (err: any) {
        // Marquer toutes les éditions du batch comme échouées
        batch.forEach(e => {
          allResults.push({
            key: e.key,
            success: false,
            error: err.message,
          });
        });
        setProgress({ current: i + batch.length, total: selectedEditions.length });
      }
    }

    setResults(allResults);
    setStep("results");
  };

  const toggleAll = (selected: boolean) => {
    setEditions(editions.map(e => ({ ...e, selected: !e.existsInDb && selected })));
  };

  const updateEdition = (key: string, field: keyof EditableEdition, value: any) => {
    setEditions(editions.map(e => 
      e.key === key ? { ...e, [field]: value } : e
    ));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Import en masse des éditions</h1>

      {/* Guide Step */}
      {step === "guide" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
              Guide d&apos;import en masse
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📁 Étape 1: Préparer vos fichiers</h3>
                <p>Nommez vos fichiers PDF selon ce format pour une détection automatique:</p>
                <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                  <li><code className="bg-blue-100 px-1 rounded">2024-01-15_Edition du Lundi.pdf</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">15-01-2024_Edition du Lundi.pdf</code></li>
                  <li><code className="bg-blue-100 px-1 rounded">Edition Speciale_2024-01-15.pdf</code></li>
                </ul>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                <h3 className="font-semibold text-amber-800 mb-2">☁️ Étape 2: Uploader vers R2</h3>
                <p>Utilisez <strong>rclone</strong>, <strong>Cyberduck</strong> ou le <strong>dashboard Cloudflare R2</strong> pour uploader vos PDFs dans le dossier:</p>
                <code className="block bg-amber-100 p-2 rounded mt-2 text-sm">
                  {process.env.NEXT_PUBLIC_R2_BUCKET || "journal-storage"}/pending-editions/
                </code>
                <p className="text-sm mt-2 text-amber-700">
                  Exemple avec rclone: <code className="bg-amber-100 px-1 rounded">rclone copy ./mes-pdfs r2:journal-storage/pending-editions/</code>
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Étape 3: Importer depuis cette page</h3>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Cliquez sur &quot;Scanner les fichiers&quot; pour voir les PDFs disponibles</li>
                  <li>Vérifiez/modifiez les titres et dates détectés</li>
                  <li>Sélectionnez les éditions à importer</li>
                  <li>Lancez l&apos;import (traitement par lots de 5)</li>
                </ol>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
                <h3 className="font-semibold text-purple-800 mb-2">⚙️ Ce qui se passe automatiquement</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Conversion du PDF en images WebP (une par page)</li>
                  <li>Upload des images vers le stockage définitif</li>
                  <li>Création de l&apos;entrée en base de données</li>
                  <li>Suppression du fichier source du dossier pending</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={fetchPendingEditions}
              disabled={loading}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Chargement...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Scanner les fichiers en attente
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* List Step */}
      {step === "list" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600">
                {editions.length} fichier(s) trouvé(s) • 
                <span className="text-emerald-600 ml-1">{editions.filter(e => !e.existsInDb).length} nouveau(x)</span> • 
                <span className="text-amber-600 ml-1">{editions.filter(e => e.existsInDb).length} déjà importé(s)</span>
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("guide")}
                className="text-gray-600 px-4 py-2 rounded hover:bg-gray-100"
              >
                ← Retour
              </button>
              <button
                onClick={() => toggleAll(true)}
                className="text-emerald-600 px-4 py-2 rounded hover:bg-emerald-50"
              >
                Tout sélectionner
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="text-gray-600 px-4 py-2 rounded hover:bg-gray-100"
              >
                Tout désélectionner
              </button>
            </div>
          </div>

          {editions.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="font-medium">Aucun fichier PDF trouvé</p>
              <p className="text-sm mt-2">Uploadez des PDFs dans le dossier <code className="bg-gray-200 px-1 rounded">pending-editions/</code></p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sélection</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fichier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {editions.map((edition) => (
                    <tr key={edition.key} className={edition.existsInDb ? "bg-amber-50 opacity-60" : ""}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={edition.selected}
                          disabled={edition.existsInDb}
                          onChange={(e) => updateEdition(edition.key, "selected", e.target.checked)}
                          className="h-4 w-4 text-emerald-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 max-w-xs truncate" title={edition.filename}>
                        {edition.filename}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={edition.title}
                          onChange={(e) => updateEdition(edition.key, "title", e.target.value)}
                          disabled={edition.existsInDb}
                          className="w-full px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={edition.datePublication}
                          onChange={(e) => updateEdition(edition.key, "datePublication", e.target.value)}
                          disabled={edition.existsInDb}
                          className="px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={edition.type}
                          onChange={(e) => updateEdition(edition.key, "type", e.target.value)}
                          disabled={edition.existsInDb}
                          className="px-2 py-1 border rounded text-sm disabled:bg-gray-100"
                        >
                          <option value="QUOTIDIEN">Quotidien</option>
                          <option value="HEBDOMADAIRE">Hebdomadaire</option>
                          <option value="SPECIAL">Spécial</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatSize(edition.size)}
                      </td>
                      <td className="px-4 py-3">
                        {edition.existsInDb ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Déjà importé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Nouveau
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editions.filter(e => e.selected).length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={processEditions}
                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Importer {editions.filter(e => e.selected).length} édition(s)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Processing Step */}
      {step === "processing" && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="animate-spin h-16 w-16 mx-auto text-emerald-600 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">Import en cours...</h2>
          <p className="text-gray-600 mb-4">
            {progress.current} / {progress.total} édition(s) traitée(s)
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4 max-w-md mx-auto">
            <div
              className="bg-emerald-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Ne fermez pas cette page pendant le traitement
          </p>
        </div>
      )}

      {/* Results Step */}
      {step === "results" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Résultats de l&apos;import</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-700">{results.length}</div>
                <div className="text-sm text-gray-500">Total traité</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-emerald-700">{results.filter(r => r.success).length}</div>
                <div className="text-sm text-emerald-600">Réussi(s)</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-700">{results.filter(r => !r.success).length}</div>
                <div className="text-sm text-red-600">Échoué(s)</div>
              </div>
            </div>

            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.key}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="font-mono text-sm">{result.key.replace("pending-editions/", "")}</span>
                  </div>
                  <div className="text-sm">
                    {result.success ? (
                      <span className="text-emerald-600">{result.pageCount} pages</span>
                    ) : (
                      <span className="text-red-600">{result.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setStep("guide");
                setResults([]);
                setEditions([]);
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700"
            >
              Nouvel import
            </button>
            <a
              href="/admin/editions/list"
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              Voir les éditions
            </a>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
