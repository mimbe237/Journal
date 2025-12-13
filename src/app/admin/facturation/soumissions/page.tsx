"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/States";

type Submission = {
  id: string;
  nom: string;
  email: string;
  type: string;
  periode: string;
  montant: number;
  devise: string;
  statut: "PENDING" | "APPROVED" | "REJECTED";
  soumisA: string;
  justificatifs: { id: string; nomFichier: string; cheminFichier: string }[];
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions/manual?status=PENDING");
      if (res.ok) {
        const json = await res.json();
        setSubmissions(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Confirmer la validation de cet abonnement ?")) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/subscriptions/manual/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Erreur lors de la validation");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const motif = prompt("Motif du rejet :");
    if (!motif) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/subscriptions/manual/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif }),
      });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
      } else {
        alert("Erreur lors du rejet");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur serveur");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <LoadingState message="Chargement des soumissions..." />;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Soumissions en attente"
          subtitle="Validez les demandes d'abonnement manuelles."
        />

        {submissions.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            Aucune soumission en attente.
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((sub) => (
              <Card key={sub.id} className="p-6 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{sub.nom}</h3>
                    <span className="text-sm text-slate-500">({sub.email})</span>
                  </div>
                  <div className="text-sm text-slate-600 grid grid-cols-2 gap-x-8 gap-y-1">
                    <p>Type: <span className="font-medium">{sub.type}</span></p>
                    <p>Durée: <span className="font-medium">{sub.periode} mois</span></p>
                    <p>Montant: <span className="font-medium">{sub.montant} {sub.devise}</span></p>
                    <p>Date: {new Date(sub.soumisA).toLocaleDateString()}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Justificatifs :</p>
                    <ul className="list-disc list-inside text-slate-600">
                      {sub.justificatifs.map((j) => (
                        <li key={j.id}>
                          <a 
                            href={`/api/admin/justificatifs/${j.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {j.nomFichier}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 justify-center min-w-[150px]">
                  <ButtonPrimary 
                    onClick={() => handleApprove(sub.id)}
                    disabled={processingId === sub.id}
                    className="justify-center bg-emerald-600 hover:bg-emerald-700"
                  >
                    Valider
                  </ButtonPrimary>
                  <ButtonSecondary 
                    onClick={() => handleReject(sub.id)}
                    disabled={processingId === sub.id}
                    className="justify-center text-red-600 hover:bg-red-50 border-red-200"
                  >
                    Rejeter
                  </ButtonSecondary>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
