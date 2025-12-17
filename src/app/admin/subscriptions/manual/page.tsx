"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function ManualSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [authRes, subRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/admin/subscriptions/manual?status=PENDING")
        ]);
        
        if (authRes.ok) {
          const authData = await authRes.json();
          setUserRole(authData.user.role);
        }

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubmissions(subData.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const canValidate = ["SUPER_ADMIN", "SUPPORT"].includes(userRole || "");

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
        const err = await res.json();
        alert(err.error || "Erreur lors de la validation");
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
        const err = await res.json();
        alert(err.error || "Erreur lors du rejet");
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
        <div className="flex items-center justify-between">
          <PageHeader
            title="Soumissions manuelles"
            subtitle="Gérez les demandes d'abonnement."
          />
          <Link href="/admin/subscriptions/manual/new">
            <ButtonPrimary>Nouvelle soumission</ButtonPrimary>
          </Link>
        </div>

        {submissions.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            Aucune soumission en attente.
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((sub) => (
              <Card key={sub.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{sub.nom}</h3>
                  <p className="text-sm text-slate-500">{sub.email}</p>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-600">
                      {sub.type} ({sub.periode} mois)
                    </span>
                    <span className="rounded bg-emerald-50 px-2 py-1 font-medium text-emerald-600">
                      {sub.montant} {sub.devise}
                    </span>
                  </div>
                </div>

                {canValidate && (
                  <div className="flex gap-2">
                    <ButtonSecondary
                      onClick={() => handleReject(sub.id)}
                      disabled={processingId === sub.id}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Rejeter
                    </ButtonSecondary>
                    <ButtonPrimary
                      onClick={() => handleApprove(sub.id)}
                      disabled={processingId === sub.id}
                    >
                      Valider
                    </ButtonPrimary>
                  </div>
                )}
                {!canValidate && (
                  <div className="text-sm text-slate-400 italic">
                    En attente de validation
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
