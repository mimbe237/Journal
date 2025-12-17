'use client';

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'journal_onboarding_completed';
const ONBOARDING_VERSION = '1.0'; // Incrémenter pour forcer un nouvel onboarding

interface UseOnboardingReturn {
  showOnboarding: boolean;
  isLoading: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'onboarding a déjà été complété
    const checkOnboarding = () => {
      try {
        const stored = localStorage.getItem(ONBOARDING_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          // Vérifier la version - si différente, montrer à nouveau
          if (data.version === ONBOARDING_VERSION) {
            setShowOnboarding(false);
          } else {
            setShowOnboarding(true);
          }
        } else {
          // Première visite
          setShowOnboarding(true);
        }
      } catch (error) {
        // En cas d'erreur, montrer l'onboarding
        setShowOnboarding(true);
      }
      setIsLoading(false);
    };

    // Délai pour ne pas bloquer le rendu initial
    const timer = setTimeout(checkOnboarding, 500);
    return () => clearTimeout(timer);
  }, []);

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(
        ONBOARDING_KEY,
        JSON.stringify({
          version: ONBOARDING_VERSION,
          completedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
    } catch (error) {
      console.error('Failed to reset onboarding state:', error);
    }
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}

export default useOnboarding;
