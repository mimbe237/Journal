'use client';

import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { OnboardingModal } from './OnboardingModal';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

export function OnboardingWrapper({ children }: OnboardingWrapperProps) {
  const { showOnboarding, isLoading, completeOnboarding } = useOnboarding();

  return (
    <>
      {children}
      {!isLoading && showOnboarding && (
        <OnboardingModal onComplete={completeOnboarding} />
      )}
    </>
  );
}

export default OnboardingWrapper;
