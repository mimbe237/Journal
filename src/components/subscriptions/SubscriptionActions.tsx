'use client';

import Link from 'next/link';

interface SubscriptionActionsProps {
  hasActiveSubscription: boolean;
}

export function SubscriptionActions({ hasActiveSubscription }: SubscriptionActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-6">
      {!hasActiveSubscription ? (
        <Link 
          href="/subscriptions" 
          className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          S'abonner maintenant
        </Link>
      ) : (
        <>
          <Link 
            href="/subscriptions" 
            className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Renouveler / Changer d'offre
          </Link>
          <Link 
            href="/subscriptions/submissions" 
            className="inline-flex justify-center items-center px-6 py-3 border border-slate-300 text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Suivre mes demandes
          </Link>
        </>
      )}
      
      <Link 
        href="/profile/payments" 
        className="inline-flex justify-center items-center px-6 py-3 border border-slate-300 text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
      >
        Historique des paiements
      </Link>
    </div>
  );
}
