import { SubmissionTracker } from '@/components/subscriptions/SubmissionTracker';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suivi des soumissions | Journal',
  description: 'Suivez l\'état de vos demandes d\'abonnement manuel.',
};

export default function SubmissionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Suivi de mes demandes</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600 mb-6">
          Retrouvez ici l'historique et le statut de vos demandes d'abonnement effectuées par virement ou dépôt direct.
        </p>
        <SubmissionTracker />
      </div>
    </div>
  );
}
