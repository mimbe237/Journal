'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Subscription = {
  id: string;
  type: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  montant: number;
  devise: string;
  source: string;
};

interface SubscriptionDetailsProps {
  subscription: Subscription | null;
  loading: boolean;
}

export function SubscriptionDetails({ subscription, loading }: SubscriptionDetailsProps) {
  if (loading) {
    return <div className="animate-pulse h-32 bg-slate-100 rounded-lg"></div>;
  }

  if (!subscription) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-slate-900 mb-2">Aucun abonnement actif</h3>
        <p className="text-slate-600 mb-4">Vous n'avez pas d'abonnement en cours actuellement.</p>
      </div>
    );
  }

  const isExpiringSoon = new Date(subscription.dateFin).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Détails de l'abonnement</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          subscription.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
        }`}>
          {subscription.statut}
        </span>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm text-slate-500 mb-1">Type d'abonnement</p>
          <p className="font-medium text-slate-900 text-lg">{subscription.type}</p>
        </div>
        
        <div>
          <p className="text-sm text-slate-500 mb-1">Prix</p>
          <p className="font-medium text-slate-900 text-lg">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: subscription.devise }).format(subscription.montant)}
            <span className="text-sm text-slate-500 font-normal ml-1">/ {subscription.type === 'ANNUEL' ? 'an' : 'mois'}</span>
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500 mb-1">Date de début</p>
          <p className="font-medium text-slate-900">
            {format(new Date(subscription.dateDebut), 'dd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div>
          <p className="text-sm text-slate-500 mb-1">Date d'expiration</p>
          <p className={`font-medium ${isExpiringSoon ? 'text-amber-600' : 'text-slate-900'}`}>
            {format(new Date(subscription.dateFin), 'dd MMMM yyyy', { locale: fr })}
          </p>
          {isExpiringSoon && (
            <p className="text-xs text-amber-600 mt-1">Expire bientôt !</p>
          )}
        </div>
      </div>
    </div>
  );
}
