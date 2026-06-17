'use client';

import { useMemo } from 'react';

interface PriceDisplayProps {
  amount: number;
  currency: string; // 'XAF' | 'EUR' | 'USD'
  showSymbol?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Composant d'affichage uniforme des prix
 * Gère les différentes devises avec leur formatage approprié
 */
export function PriceDisplay({ 
  amount, 
  currency, 
  showSymbol = true,
  className = '',
  size = 'md'
}: PriceDisplayProps) {
  const formattedPrice = useMemo(() => {
    const upperCurrency = currency?.toUpperCase() || 'XAF';
    
    // Configuration par devise
    const currencyConfig: Record<string, { locale: string; symbol: string; position: 'before' | 'after' }> = {
      XAF: { locale: 'fr-CM', symbol: 'FCFA', position: 'after' },
      EUR: { locale: 'fr-FR', symbol: '€', position: 'after' },
      USD: { locale: 'en-US', symbol: '$', position: 'before' },
    };

    const config = currencyConfig[upperCurrency] || currencyConfig.XAF;

    // Formater le nombre avec séparateurs
    const formattedNumber = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: upperCurrency === 'XAF' ? 0 : 2,
      maximumFractionDigits: upperCurrency === 'XAF' ? 0 : 2,
    }).format(amount);

    if (!showSymbol) {
      return formattedNumber;
    }

    // Afficher avec symbole
    if (config.position === 'before') {
      return `${config.symbol}${formattedNumber}`;
    }
    return `${formattedNumber} ${config.symbol}`;
  }, [amount, currency, showSymbol]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
    xl: 'text-2xl font-bold'
  };

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {formattedPrice}
    </span>
  );
}

/**
 * Hook pour formater les prix
 */
export function useFormatPrice() {
  return (amount: number, currency: string, showSymbol = true): string => {
    const upperCurrency = currency?.toUpperCase() || 'XAF';
    
    const currencyConfig: Record<string, { locale: string; symbol: string; position: 'before' | 'after' }> = {
      XAF: { locale: 'fr-CM', symbol: 'FCFA', position: 'after' },
      EUR: { locale: 'fr-FR', symbol: '€', position: 'after' },
      USD: { locale: 'en-US', symbol: '$', position: 'before' },
    };

    const config = currencyConfig[upperCurrency] || currencyConfig.XAF;

    const formattedNumber = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: upperCurrency === 'XAF' ? 0 : 2,
      maximumFractionDigits: upperCurrency === 'XAF' ? 0 : 2,
    }).format(amount);

    if (!showSymbol) {
      return formattedNumber;
    }

    if (config.position === 'before') {
      return `${config.symbol}${formattedNumber}`;
    }
    return `${formattedNumber} ${config.symbol}`;
  };
}

/**
 * Fonction utilitaire pour formater les prix (sans hook)
 */
export function formatPrice(amount: number, currency: string, showSymbol = true): string {
  const upperCurrency = currency?.toUpperCase() || 'XAF';
  
  const currencyConfig: Record<string, { locale: string; symbol: string; position: 'before' | 'after' }> = {
    XAF: { locale: 'fr-CM', symbol: 'FCFA', position: 'after' },
    EUR: { locale: 'fr-FR', symbol: '€', position: 'after' },
    USD: { locale: 'en-US', symbol: '$', position: 'before' },
  };

  const config = currencyConfig[upperCurrency] || currencyConfig.XAF;

  const formattedNumber = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: upperCurrency === 'XAF' ? 0 : 2,
    maximumFractionDigits: upperCurrency === 'XAF' ? 0 : 2,
  }).format(amount);

  if (!showSymbol) {
    return formattedNumber;
  }

  if (config.position === 'before') {
    return `${config.symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${config.symbol}`;
}

export default PriceDisplay;
