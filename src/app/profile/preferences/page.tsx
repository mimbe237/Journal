'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/lib/hooks/useToast';

interface UserPreferences {
  newEditions: boolean;
  expirationAlerts: boolean;
  newsletter: boolean;
  summaryFrequency: 'daily' | 'weekly' | 'never';
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
}

export default function PreferencesPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    newEditions: true,
    expirationAlerts: true,
    newsletter: false,
    summaryFrequency: 'weekly',
    theme: 'light',
    fontSize: 'medium',
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/auth/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        addToast('Préférences enregistrées', 'success');
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      addToast('Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof UserPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelect = (key: keyof UserPreferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au profil
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Préférences</h1>
          <p className="mt-1 text-slate-600">
            Personnalisez votre expérience sur la plateforme
          </p>
        </div>

        {/* Notifications */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Notifications par email</h2>
            <p className="text-sm text-slate-500">Choisissez les emails que vous souhaitez recevoir</p>
          </div>
          <div className="p-6 space-y-4">
            <ToggleItem
              label="Nouvelles éditions"
              description="Recevoir une notification lors de la publication d'une nouvelle édition"
              checked={preferences.newEditions}
              onChange={() => handleToggle('newEditions')}
            />
            <ToggleItem
              label="Alertes d'expiration"
              description="Être notifié avant l'expiration de votre abonnement"
              checked={preferences.expirationAlerts}
              onChange={() => handleToggle('expirationAlerts')}
            />
            <ToggleItem
              label="Newsletter"
              description="Recevoir notre newsletter mensuelle avec les actualités"
              checked={preferences.newsletter}
              onChange={() => handleToggle('newsletter')}
            />
          </div>
        </section>

        {/* Summary Frequency */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Résumé d'activité</h2>
            <p className="text-sm text-slate-500">Fréquence d'envoi du résumé de lecture</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'daily', label: 'Quotidien' },
                { value: 'weekly', label: 'Hebdomadaire' },
                { value: 'never', label: 'Jamais' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSelect('summaryFrequency', option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    preferences.summaryFrequency === option.value
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Reading Preferences */}
        <section className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">Préférences de lecture</h2>
            <p className="text-sm text-slate-500">Personnalisez l'affichage du lecteur</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Taille de police
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'small', label: 'Petite', size: 'text-sm' },
                  { value: 'medium', label: 'Moyenne', size: 'text-base' },
                  { value: 'large', label: 'Grande', size: 'text-lg' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect('fontSize', option.value)}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${option.size} ${
                      preferences.fontSize === option.value
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Thème
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'light', label: 'Clair', icon: '☀️' },
                  { value: 'dark', label: 'Sombre', icon: '🌙' },
                  { value: 'system', label: 'Système', icon: '💻' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect('theme', option.value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${
                      preferences.theme === option.value
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Enregistrement...
              </>
            ) : (
              'Enregistrer les préférences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition ${
          checked ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
