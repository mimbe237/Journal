"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

// Mapping des catégories avec libellés et descriptions
const INTERESTS_CONFIG = [
  {
    id: "ECONOMIE",
    label: "Économie & Finance",
    description: "Marchés, entreprises et tendances économiques",
    icon: "📈",
  },
  {
    id: "TECH",
    label: "Tech & Innovation",
    description: "Numérique, startups et nouvelles technologies",
    icon: "💻",
  },
  {
    id: "POLITIQUE",
    label: "Politique",
    description: "Actualité politique nationale et internationale",
    icon: "🏛️",
  },
  {
    id: "SOCIETE",
    label: "Société & Culture",
    description: "Débats de société, culture et art de vivre",
    icon: "🌍",
  },
  {
    id: "EDUCATION",
    label: "Éducation",
    description: "Enseignement, recherche et formation",
    icon: "🎓",
  },
  {
    id: "SPORT",
    label: "Sport",
    description: "Actualité sportive et grands événements",
    icon: "⚽",
  },
];

interface InterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInterests?: string[];
  onSave?: (interests: string[]) => void;
}

export function InterestsModal({
  isOpen,
  onClose,
  initialInterests = [],
  onSave,
}: InterestsModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== id));
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selectedInterests }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      if (onSave) onSave(selectedInterests);
      
      // Refresh router to update any server components relying on this data
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vos centres d'intérêt"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300">
          Sélectionnez les thématiques qui vous intéressent pour personnaliser votre expérience de lecture.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {INTERESTS_CONFIG.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id);
            return (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`
                  relative flex items-start p-4 rounded-xl border-2 text-left transition-all duration-200
                  ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
                  }
                `}
              >
                <div className="text-2xl mr-3">{interest.icon}</div>
                <div>
                  <div
                    className={`font-semibold ${
                      isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {interest.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {interest.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose}>
            Plus tard
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer mes préférences"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
