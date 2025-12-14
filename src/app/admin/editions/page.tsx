"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EditionType } from "@prisma/client";

type UploadState = "idle" | "uploading" | "success" | "error";
type UploadStep = "upload" | "conversion" | "database" | "complete";

interface JournalType {
  id: string;
  name: string;
  frequency: EditionType;
  unitPrice: number;
}

export default function AdminEditionsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [titre, setTitre] = useState("");
  const [type, setType] = useState<EditionType>(EditionType.QUOTIDIEN);
  const [datePublication, setDatePublication] = useState(new Date().toISOString().split("T")[0]);
  const [prix, setPrix] = useState<string>("");
  const [state, setState] = useState<UploadState>("idle");
  const [currentStep, setCurrentStep] = useState<UploadStep | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const [journalTypes, setJournalTypes] = useState<JournalType[]>([]);
  const [selectedJournalTypeId, setSelectedJournalTypeId] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/journal-types")
      .then((res) => res.json())
      .then((data) => {
        setJournalTypes(data);
        if (data.length > 0) {
          setSelectedJournalTypeId(data[0].id);
        }
      })
      .catch((err) => console.error("Failed to fetch journal types", err));
  }, []);

  useEffect(() => {
    const jt = journalTypes.find(j => j.id === selectedJournalTypeId);
    if (jt) {
      setType(jt.frequency);
      setPrix(jt.unitPrice.toString());
    }
  }, [selectedJournalTypeId, journalTypes]);

  const steps = [
    { key: "upload" as UploadStep, label: "Téléchargement du PDF" },
    { key: "conversion" as UploadStep, label: "Conversion en images" },
    { key: "database" as UploadStep, label: "Création de l'édition" },
    { key: "complete" as UploadStep, label: "Terminé" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !titre) {
      setMessage("Fichier et titre requis");
      return;
    }

    setHint("Conversion en cours : restez sur la page, cela peut prendre quelques secondes selon la taille du PDF.");
    setState("uploading");
    setMessage(null);
    setEditionId(null);
    setCurrentStep("upload");

    try {
      // 1. Get Presigned URL for PDF
      setCurrentStep("upload");
      const presignRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || "Erreur pré-signature");

      // 2. Upload PDF directly to R2
      try {
        const uploadRes = await fetch(presignData.url, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        });
        if (!uploadRes.ok) throw new Error("Erreur lors de l'upload vers le stockage");
      } catch (err: any) {
        if (err.message === "Failed to fetch") {
          throw new Error("Erreur CORS : Configurez les règles CORS sur votre bucket R2.");
        }
        throw err;
      }

      // 3. Send metadata to backend for processing
      setCurrentStep("conversion");
      const formData = new FormData();
      formData.append("fileKey", presignData.key); // Send the key, not the file
      if (coverImage) formData.append("coverImage", coverImage);
      formData.append("titre", titre);
      formData.append("type", type);
      formData.append("datePublication", datePublication);
      if (prix) formData.append("prix", prix);
      if (selectedJournalTypeId) formData.append("journalTypeId", selectedJournalTypeId);

      const res = await fetch("/api/admin/editions/upload", {
        method: "POST",
        body: formData
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Traitement échoué");

      setCurrentStep("database");

      setCurrentStep("complete");
      setState("success");
      setMessage(`Édition créée : ${json.pageCount} pages converties`);
      setEditionId(json.editionId);
      setFile(null);
      setCoverImage(null);
      setTitre("");
      setHint(null);
      
      // Réinitialiser l'étape après 2 secondes
      setTimeout(() => setCurrentStep(null), 2000);
    } catch (err: any) {
      setState("error");
      setCurrentStep(null);
      setMessage(err?.message ?? "Erreur upload");
      setHint(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Nouvelle édition</h1>
              <p className="mt-2 text-slate-600">Uploadez un PDF pour créer une nouvelle édition</p>
            </div>
            <Link 
              href="/admin/editions/list" 
              className="text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              Voir toutes les éditions →
            </Link>
          </div>
        </div>

        <Card className="space-y-6 bg-white shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Journal Type */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Journal / Publication</label>
              <select
                value={selectedJournalTypeId}
                onChange={(e) => setSelectedJournalTypeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              >
                <option value="" disabled>Sélectionner un journal</option>
                {journalTypes.map((jt) => (
                  <option key={jt.id} value={jt.id}>
                    {jt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Titre de l'édition</label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="ex: Journal du 12 décembre"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            {/* Date de publication */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Date de publication</label>
              <input
                type="date"
                value={datePublication}
                onChange={(e) => setDatePublication(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Fichier PDF */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Fichier PDF</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 file:rounded file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-white hover:border-emerald-500"
                  required
                />
                {file && <p className="mt-2 text-sm text-emerald-300">✓ {file.name}</p>}
              </div>
            </div>

            {/* Image de Une */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Image de Une (optionnel)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 file:rounded file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-white hover:border-emerald-500"
                />
                {coverImage && (
                  <div className="mt-2">
                    <p className="text-sm text-emerald-300 mb-2">✓ {coverImage.name}</p>
                    <img 
                      src={URL.createObjectURL(coverImage)} 
                      alt="Aperçu" 
                      className="h-32 w-auto rounded border border-slate-600"
                    />
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Si non fournie, la première page du PDF sera utilisée
              </p>
            </div>

            {message && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  state === "success"
                    ? "border border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                    : "border border-red-500/30 bg-red-950/30 text-red-200"
                }`}
              >
                {message}
              </div>
            )}
            {hint && state === "uploading" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {hint}
              </div>
            )}

            {/* Barre de progression */}
            {state === "uploading" && currentStep && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Progression</span>
                  <span className="text-slate-600">
                    {steps.findIndex((s) => s.key === currentStep) + 1} / {steps.length}
                  </span>
                </div>
                
                {/* Barre de progression visuelle */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-400 ease-out"
                    style={{
                      width: `${((steps.findIndex((s) => s.key === currentStep) + 1) / steps.length) * 100}%`
                    }}
                  />
                </div>

                {/* Liste des étapes */}
                <div className="space-y-2">
                  {steps.map((step, index) => {
                    const currentIndex = steps.findIndex((s) => s.key === currentStep);
                    const isComplete = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    
                    return (
                      <div key={step.key} className="flex items-center gap-3 text-sm">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            isComplete
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                              ? "border-2 border-emerald-400 bg-emerald-50 text-emerald-600"
                              : "border border-slate-300 text-slate-400"
                          }`}
                        >
                          {isComplete ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isComplete
                                ? "text-slate-700"
                                : isCurrent
                                ? "text-slate-900 font-medium"
                                : "text-slate-400"
                            }
                          >
                            {step.label}
                          </span>
                          {isCurrent && (
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <ButtonPrimary type="submit" disabled={state === "uploading"} className="w-full">
              {state === "uploading" ? "Upload en cours..." : "Charger l'édition"}
            </ButtonPrimary>
          </form>

          {editionId && state === "success" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
              <p>
                Edition créée :
                <code className="ml-2 rounded bg-slate-800 px-2 py-1">{editionId}</code>
              </p>
              <p className="mt-2">Elle est maintenant accessible aux utilisateurs avec un abonnement actif.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

