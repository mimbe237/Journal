'use client';

import { useEffect, useState } from 'react';
import { SubscriptionDetails } from '@/components/subscriptions/SubscriptionDetails';
import { SubscriptionActions } from '@/components/subscriptions/SubscriptionActions';

export default function ManageSubscriptionPage() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions/active');
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Gérer mon abonnement</h1>
      
      <SubscriptionDetails subscription={subscription} loading={loading} />
      
      <SubscriptionActions hasActiveSubscription={!!subscription} />
      
      <div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
        <p className="text-blue-800 mb-4">
          Si vous rencontrez des problèmes avec votre abonnement ou si vous souhaitez le résilier, notre équipe support est là pour vous aider.
        </p>
        <a 
          href="mailto:support@journal.com" 
          className="text-blue-700 font-medium hover:text-blue-900 underline"
        >
          Contacter le support
        </a>
      </div>
    </div>
  );
}
