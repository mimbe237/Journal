'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/States';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'form' | 'processing' | 'success' | 'error'>('loading');
  const [invitation, setInvitation] = useState<{
    enterpriseName: string;
    email: string;
    role: string;
    expireAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
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
        setStatus('error');
        setError(data.error || 'Invitation invalide ou expirée');
        return;
      }

      setInvitation(data.invitation);
      setStatus('form');
    } catch (err) {
      setStatus('error');
      setError('Erreur lors de la validation de l\'invitation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    setStatus('processing');
    setError(null);

    try {
      const res = await fetch('/api/enterprise/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          nom: formData.nom,
          password: formData.password
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'acceptation');
      }

      setStatus('success');
      setTimeout(() => {
        router.push('/auth/login?message=Compte créé avec succès. Connectez-vous pour accéder à votre espace.');
      }, 3000);
    } catch (err: any) {
      setStatus('form');
      setError(err.message);
    }
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      ADMIN_PRIMAIRE: 'Administrateur Principal',
      ADMIN_SECONDAIRE: 'Administrateur',
      MANAGER: 'Manager',
      UTILISATEUR: 'Utilisateur'
    };
    return role ? labels[role] || role : 'Utilisateur';
  };

  if (status === 'loading') {
    return <LoadingState message="Validation de l'invitation..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {status === 'error' && !invitation && (
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

        {status === 'form' && invitation && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Bienvenue !</h1>
              <p className="text-gray-600">
                Vous êtes invité à rejoindre <strong>{invitation.enterpriseName}</strong> en tant que <strong>{getRoleLabel(invitation.role)}</strong>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Votre email</p>
                <p className="font-medium text-gray-900">{invitation.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Votre nom complet
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" className="w-full">
                Créer mon compte
              </Button>

              <p className="text-xs text-center text-gray-500">
                En créant votre compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
              </p>
            </form>
          </>
        )}

        {status === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Création de votre compte...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Compte créé !</h1>
            <p className="text-gray-600 mb-4">
              Votre compte a été créé avec succès. Vous allez être redirigé vers la page de connexion.
            </p>
            <Link href="/auth/login">
              <Button>Se connecter</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement..." />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
