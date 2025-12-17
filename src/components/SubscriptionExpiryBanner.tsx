'use client';

import Link from 'next/link';

interface SubscriptionExpiryBannerProps {
  daysRemaining: number;
  expiryDate: string;
  onDismiss?: () => void;
}

/**
 * Bannière d'alerte d'expiration d'abonnement
 * Affichée sur le dashboard quand l'abonnement expire bientôt
 */
export function SubscriptionExpiryBanner({ 
  daysRemaining, 
  expiryDate,
  onDismiss 
}: SubscriptionExpiryBannerProps) {
  // Déterminer le niveau d'urgence
  const isUrgent = daysRemaining <= 1;
  const isWarning = daysRemaining <= 7 && daysRemaining > 1;

  const bgColor = isUrgent 
    ? 'bg-gradient-to-r from-red-500 to-red-600' 
    : isWarning 
      ? 'bg-gradient-to-r from-amber-500 to-amber-600'
      : 'bg-gradient-to-r from-blue-500 to-blue-600';

  const icon = isUrgent ? (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const message = isUrgent
    ? daysRemaining === 0
      ? "Votre abonnement expire aujourd'hui !"
      : "Votre abonnement expire demain !"
    : `Votre abonnement expire dans ${daysRemaining} jours`;

  return (
    <div className={`${bgColor} text-white shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon}
            <div className="text-center sm:text-left">
              <p className="font-semibold">{message}</p>
              <p className="text-sm opacity-90">
                Date d&apos;expiration : {expiryDate}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/subscriptions"
              className="bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Renouveler maintenant
            </Link>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Bannière pour abonnement expiré
 */
export function SubscriptionExpiredBanner() {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <div className="text-center sm:text-left">
              <p className="font-semibold">Votre abonnement a expiré</p>
              <p className="text-sm text-slate-300">
                Renouvelez pour continuer à accéder aux éditions
              </p>
            </div>
          </div>
          
          <Link
            href="/subscriptions"
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-600 transition-colors"
          >
            Renouveler mon abonnement
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionExpiryBanner;
