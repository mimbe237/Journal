'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type FormState = {
  nom: string;
  contactEmail: string;
  contactTelephone: string;
  adminPrimaireEmail: string;
  nombreUtilisateursInclus: number;
  niveauSla: string;
  adresseFacturation: string;
  numeroSiret: string;
  organizationType: string;
  organizationSize: string;
  sector: string;
  interests: string[];
};

type ErrorState = string | null;

const ORG_TYPES = [
  { value: "STARTUP", label: "Startup" },
  { value: "PME", label: "PME" },
  { value: "GRAND_GROUPE", label: "Grand Groupe" },
  { value: "ADMINISTRATION", label: "Administration" },
  { value: "ONG", label: "ONG" },
  { value: "EDUCATION", label: "Éducation" },
  { value: "SANTE", label: "Santé" },
  { value: "MEDIA", label: "Média" },
  { value: "PARTICULIER", label: "Particulier" },
];

const ORG_SIZES = [
  { value: "MICRO", label: "Micro (<10)" },
  { value: "SMALL", label: "Petite (10-50)" },
  { value: "MEDIUM", label: "Moyenne (50-250)" },
  { value: "LARGE", label: "Grande (250+)" },
];

const INTERESTS = [
  { value: "ECONOMIE", label: "Économie" },
  { value: "TECH", label: "Tech" },
  { value: "POLITIQUE", label: "Politique" },
  { value: "SOCIETE", label: "Société" },
  { value: "EDUCATION", label: "Éducation" },
  { value: "SPORT", label: "Sport" },
];

export default function NewEnterprisePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>({
    nom: '',
    contactEmail: '',
    contactTelephone: '',
    adminPrimaireEmail: '',
    nombreUtilisateursInclus: 5,
    niveauSla: 'standard',
    adresseFacturation: '',
    numeroSiret: '',
    organizationType: '',
    organizationSize: '',
    sector: '',
    interests: [],
  });
  const [sendInvitation, setSendInvitation] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorState>(null);

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/enterprises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sendAdminInvitation: sendInvitation,
        }),
      });

      const data = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de la création de l'entreprise");
      }

      const enterpriseId: string | undefined = data?.enterprise?.id;
      if (enterpriseId) {
        router.push(`/admin/enterprises/${enterpriseId}`);
      } else {
        router.push('/admin/enterprises');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erreur inattendue");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <PageHeader
        title="Nouvelle entreprise"
        description="Configurez un compte B2B et invitez son administrateur principal."
        actions={
          <Link
            href="/admin/enterprises"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Annuler
          </Link>
        }
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Informations principales</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nom: event.target.value }))}
                  placeholder="ACME Corporation"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email de contact *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(event) => setFormData((prev) => ({ ...prev, contactEmail: event.target.value }))}
                  placeholder="contact@entreprise.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.contactTelephone}
                  onChange={(event) => setFormData((prev) => ({ ...prev, contactTelephone: event.target.value }))}
                  placeholder="+237 6XX XXX XXX"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-4">
            <h2 className="text-lg font-semibold text-slate-900">Profilage (Ciblage Publicitaire)</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Type d'organisation</label>
                <select
                  value={formData.organizationType}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {ORG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Taille</label>
                <select
                  value={formData.organizationSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationSize: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  {ORG_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Secteur d'activité</label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                  placeholder="Ex: Agroalimentaire, BTP, Services..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Centres d'intérêt</label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest.value}
                      type="button"
                      onClick={() => toggleInterest(interest.value)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        formData.interests.includes(interest.value)
                          ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {interest.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-purple-100 bg-purple-50 p-4">
            <h2 className="text-sm font-semibold text-purple-800">Administrateur primaire</h2>
            <div className="space-y-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email de l'admin primaire *
              </label>
              <input
                type="email"
                required
                value={formData.adminPrimaireEmail}
                onChange={(event) => setFormData((prev) => ({ ...prev, adminPrimaireEmail: event.target.value }))}
                placeholder="admin@entreprise.com"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <p className="text-xs text-purple-700">
                Cette personne recevra une invitation et pourra gérer les utilisateurs de l'entreprise.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={sendInvitation}
                onChange={(event) => setSendInvitation(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              Envoyer l'invitation par email maintenant
            </label>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nombre de licences *
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.nombreUtilisateursInclus}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, nombreUtilisateursInclus: Number(event.target.value) }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Niveau SLA
              </label>
              <select
                value={formData.niveauSla}
                onChange={(event) => setFormData((prev) => ({ ...prev, niveauSla: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Numéro SIRET / Registre de commerce
              </label>
              <input
                type="text"
                value={formData.numeroSiret}
                onChange={(event) => setFormData((prev) => ({ ...prev, numeroSiret: event.target.value }))}
                placeholder="123 456 789 00012"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Adresse de facturation
              </label>
              <textarea
                value={formData.adresseFacturation}
                onChange={(event) => setFormData((prev) => ({ ...prev, adresseFacturation: event.target.value }))}
                rows={3}
                placeholder="123 Rue Exemple, 75000 Paris"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin/enterprises"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Annuler
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : "Créer l'entreprise"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
