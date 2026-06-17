'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface OnboardingModalProps {
  onComplete: () => void;
}

const STEPS = [
  {
    id: 1,
    title: 'Bienvenue sur Journal ! 👋',
    description: 'Nous sommes ravis de vous accueillir. Découvrez en quelques étapes comment profiter pleinement de votre espace.',
    image: '/onboarding/welcome.svg',
    icon: '🎉'
  },
  {
    id: 2,
    title: 'Découvrez les éditions',
    description: 'Parcourez notre catalogue d\'éditions numériques. Quotidiens, hebdomadaires, hors-séries... tout est accessible en quelques clics.',
    image: '/onboarding/editions.svg',
    icon: '📰'
  },
  {
    id: 3,
    title: 'Lisez confortablement',
    description: 'Notre lecteur s\'adapte à tous vos appareils. Zoomez, naviguez entre les pages, et reprenez votre lecture là où vous l\'aviez laissée.',
    image: '/onboarding/reader.svg',
    icon: '📖'
  },
  {
    id: 4,
    title: 'Gérez votre abonnement',
    description: 'Suivez votre abonnement, renouvelez-le facilement et accédez à votre historique de paiements depuis votre profil.',
    image: '/onboarding/subscription.svg',
    icon: '💳'
  },
  {
    id: 5,
    title: 'Besoin d\'aide ?',
    description: 'Notre équipe support est disponible pour répondre à toutes vos questions. Consultez la FAQ ou contactez-nous directement.',
    image: '/onboarding/support.svg',
    icon: '💬'
  }
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header avec bouton skip */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
          >
            Passer
          </button>
        </div>

        {/* Contenu */}
        <div className="p-8 text-center">
          {/* Icône */}
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">{step.icon}</span>
          </div>

          {/* Image optionnelle */}
          {step.image && (
            <div className="h-32 mb-6 relative">
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Texte */}
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {step.title}
          </h2>
          <p className="text-slate-600 mb-8">
            {step.description}
          </p>

          {/* Indicateurs de progression */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-emerald-500'
                    : index < currentStep
                      ? 'w-2 bg-emerald-300'
                      : 'w-2 bg-slate-200'
                }`}
                aria-label={`Étape ${index + 1}`}
              />
            ))}
          </div>

          {/* Boutons de navigation */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
              >
                Précédent
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
            >
              {isLastStep ? 'Commencer !' : 'Suivant'}
            </button>
          </div>
        </div>

        {/* Étape actuelle */}
        <div className="bg-slate-50 px-8 py-3 text-center text-sm text-slate-500">
          Étape {currentStep + 1} sur {STEPS.length}
        </div>
      </div>
    </div>
  );
}

export default OnboardingModal;
