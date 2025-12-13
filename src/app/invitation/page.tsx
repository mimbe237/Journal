'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';

function InvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepting' | 'success' | 'error'>('loading');
  const [invitation, setInvitation] = useState<{
    enterpriseName: string;
    email: string;
    expireAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setError('Token d\'invitation manquant');
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/invitations/validate?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus('invalid');
        setError(data.error || 'Invitation invalide');
        return;
      }

      setInvitation(data.invitation);
      setNeedsRegistration(data.needsRegistration);
      setStatus('valid');
    } catch (err) {
      setStatus('invalid');
      setError('Erreur lors de la validation');
    }
  };

  const handleAccept = async () => {
    if (needsRegistration) {
      // Redirect to registration with token
      router.push(`/auth/register?invitation=${token}`);
      return;
    }

    setStatus('accepting');
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'acceptation');
      }

      setStatus('success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  if (status === 'loading') {
    return <LoadingState message="Validation de l'invitation..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {status === 'invalid' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation invalide</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/">
              <Button variant="secondary">Retour à l'accueil</Button>
            </Link>
          </div>
        )}

        {status === 'valid' && invitation && (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation à rejoindre</h1>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">{invitation.enterpriseName}</h2>
            <p className="text-gray-600 mb-2">
              Vous avez été invité à rejoindre cette entreprise en tant qu'utilisateur.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Cette invitation expire le {new Date(invitation.expireAt).toLocaleDateString('fr-FR')}
            </p>
            
            {needsRegistration ? (
              <div className="space-y-4">
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  Vous devez d'abord créer un compte pour accepter cette invitation.
                </p>
                <Button onClick={handleAccept} className="w-full">
                  Créer mon compte
                </Button>
              </div>
            ) : (
              <Button onClick={handleAccept} className="w-full">
                Accepter l'invitation
              </Button>
            )}
          </div>
        )}

        {status === 'accepting' && (
          <div className="text-center">
            <LoadingState message="Traitement en cours..." />
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Bienvenue !</h1>
            <p className="text-gray-600 mb-4">
              Vous avez rejoint l'entreprise avec succès.
            </p>
            <p className="text-sm text-gray-500">Redirection en cours...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => setStatus('valid')} variant="secondary">
              Réessayer
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement..." />}>
      <InvitationContent />
    </Suspense>
  );
}
