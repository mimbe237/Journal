"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Headline {
  title: string;
  page?: number;
}

interface HeadlinesEditorProps {
  editionId: string;
  initialHeadlines: Headline[];
  initialTags: string[];
  onSave?: () => void;
}

export function HeadlinesEditor({
  editionId,
  initialHeadlines,
  initialTags,
  onSave,
}: HeadlinesEditorProps) {
  const [headlines, setHeadlines] = useState<Headline[]>(initialHeadlines || []);
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- Headlines Management ---
  const addHeadline = () => {
    setHeadlines([...headlines, { title: "", page: 1 }]);
  };

  const updateHeadline = (index: number, field: keyof Headline, value: string | number) => {
    const newHeadlines = [...headlines];
    newHeadlines[index] = { ...newHeadlines[index], [field]: value };
    setHeadlines(newHeadlines);
  };

  const removeHeadline = (index: number) => {
    setHeadlines(headlines.filter((_, i) => i !== index));
  };

  // --- Tags Management ---
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // --- Save ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/editions/${editionId}/metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headlines, tags }),
      });

      if (!res.ok) throw new Error("Erreur sauvegarde");
      if (onSave) onSave();
      alert("Modifications enregistrées !");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Auto-Extraction Simulation ---
  const simulateAutoExtraction = () => {
    // Ici, on pourrait appeler une API qui fait de l'OCR
    // Pour l'instant, on simule des données
    const mockHeadlines = [
      { title: "Éditorial: Vers une nouvelle ère", page: 2 },
      { title: "Dossier Spécial: L'économie numérique", page: 5 },
      { title: "Interview exclusive du Ministre", page: 12 },
    ];
    const mockTags = ["Économie", "Politique", "Numérique", "Interview"];
    
    if (confirm("Cela va remplacer les données actuelles par une extraction automatique. Continuer ?")) {
      setHeadlines(mockHeadlines);
      setTags(mockTags);
    }
  };

  return (
    <div className="space-y-8 bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Grands Titres (Sommaire)
          </h3>
          <Button variant="secondary" onClick={simulateAutoExtraction} type="button">
            ✨ Extraction Auto (IA)
          </Button>
        </div>
        
        <div className="space-y-3">
          {headlines.map((headline, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1">
                <input
                  type="text"
                  value={headline.title}
                  onChange={(e) => updateHeadline(index, "title", e.target.value)}
                  placeholder="Titre de l'article"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  value={headline.page}
                  onChange={(e) => updateHeadline(index, "page", parseInt(e.target.value))}
                  placeholder="Page"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                />
              </div>
              <button
                onClick={() => removeHeadline(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
              >
                🗑️
              </button>
            </div>
          ))}
          <Button variant="secondary" onClick={addHeadline} className="w-full mt-2">
            + Ajouter un titre
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Mots-clés (Tags)
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm dark:bg-blue-900/30 dark:text-blue-300"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-blue-900 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="Nouveau tag..."
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white"
          />
          <Button onClick={addTag} variant="secondary">Ajouter</Button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Enregistrement..." : "Enregistrer les métadonnées"}
        </Button>
      </div>
    </div>
  );
}
