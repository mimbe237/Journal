'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Submission = {
  id: string;
  type: string;
  periode: string;
  montant: number;
  devise: string;
  statut: 'PENDING' | 'APPROVED' | 'REJECTED';
  motifRejet?: string;
  soumisA: string;
  valideA?: string;
};

export function SubmissionTracker() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('/api/subscriptions/submissions');
        if (!res.ok) throw new Error('Erreur lors du chargement');
        const data = await res.json();
        setSubmissions(data.submissions);
      } catch (err) {
        setError('Impossible de charger vos soumissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) return <div className="p-4 text-center text-slate-500">Chargement du suivi...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (submissions.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600">Aucune soumission en cours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => (
        <div key={sub.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900">
                Abonnement {sub.type}
              </span>
              <StatusBadge status={sub.statut} />
            </div>
            <p className="text-sm text-slate-500">
              Soumis le {format(new Date(sub.soumisA), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Montant : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: sub.devise }).format(sub.montant)}
            </p>
            {sub.statut === 'REJECTED' && sub.motifRejet && (
              <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                <strong>Motif du rejet :</strong> {sub.motifRejet}
              </div>
            )}
             {sub.statut === 'APPROVED' && sub.valideA && (
              <div className="mt-2 p-2 bg-emerald-50 text-emerald-700 text-sm rounded border border-emerald-100">
                Validé le {format(new Date(sub.valideA), 'dd MMMM yyyy', { locale: fr })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'PENDING':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">En attente</span>;
    case 'APPROVED':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Validée</span>;
    case 'REJECTED':
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejetée</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
  }
}
