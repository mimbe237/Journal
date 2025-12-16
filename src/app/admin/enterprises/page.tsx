'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { Input, Label } from '@/components/ui/FormControls';

interface EnterpriseAccount {
  id: string;
  nom: string;
  contactEmail: string;
  contactTelephone?: string;
  nombreUtilisateursInclus: number;
  niveauSla?: string;
  dateCreation: string;
  _count?: {
    users: number;
  };
}

export default function EnterprisesPage() {
  const [enterprises, setEnterprises] = useState<EnterpriseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [selectedEnterprise, setSelectedEnterprise] = useState<EnterpriseAccount | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showLicencesModal, setShowLicencesModal] = useState(false);

  const fetchEnterprises = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/enterprises?take=100');
      if (!res.ok) throw new Error('Erreur de chargement');
      const data = await res.json();
      setEnterprises(data.enterprises || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, []);

  if (loading) return <LoadingState message="Chargement des entreprises..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <PageHeader
        title="Comptes Entreprise"
        description="Gérez les clients B2B, leurs licences et leurs utilisateurs."
        actions={
          <Link
            href="/admin/enterprises/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
          >
            + Nouvelle entreprise
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Entreprise</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Licences</th>
              <th className="px-4 py-3 font-medium">SLA</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enterprises.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Aucune entreprise trouvée.
                </td>
              </tr>
            ) : (
              enterprises.map((ent) => (
                <tr key={ent.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/enterprises/${ent.id}`} className="font-medium text-slate-900 hover:text-emerald-600 hover:underline">
                      {ent.nom}
                    </Link>
                    <div className="text-xs text-slate-500">
                      Créé le {new Date(ent.dateCreation).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{ent.contactEmail}</div>
                    <div className="text-xs text-slate-500">{ent.contactTelephone || '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ent._count?.users || 0}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-600">{ent.nombreUtilisateursInclus}</span>
                      <button
                        onClick={() => {
                          setSelectedEnterprise(ent);
                          setShowLicencesModal(true);
                        }}
                        className="ml-2 text-xs text-emerald-600 hover:text-emerald-800"
                      >
                        (Modifier)
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 capitalize">
                      {ent.niveauSla || 'Standard'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedEnterprise(ent);
                          setShowBulkModal(true);
                        }}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        + Utilisateurs
                      </button>
                      <Link
                        href={`/admin/enterprises/${ent.id}`}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Gérer
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {showBulkModal && selectedEnterprise && (
        <BulkUsersModal
          enterprise={selectedEnterprise}
          onClose={() => {
            setShowBulkModal(false);
            setSelectedEnterprise(null);
          }}
          onCreated={() => {
            setShowBulkModal(false);
            setSelectedEnterprise(null);
            fetchEnterprises();
          }}
        />
      )}

      {showLicencesModal && selectedEnterprise && (
        <LicencesModal
          enterprise={selectedEnterprise}
          onClose={() => {
            setShowLicencesModal(false);
            setSelectedEnterprise(null);
          }}
          onUpdated={() => {
            setShowLicencesModal(false);
            setSelectedEnterprise(null);
            fetchEnterprises();
          }}
        />
      )}
    </div>
  );
}

// Modal d'ajout en masse d'utilisateurs entreprise
function BulkUsersModal({
  enterprise,
  onClose,
  onCreated
}: {
  enterprise: EnterpriseAccount;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [rows, setRows] = useState(
    Array.from({ length: 5 }, () => ({ nom: "", email: "", fonction: "" }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const licencesDisponibles =
    enterprise.nombreUtilisateursInclus - (enterprise._count?.users || 0);

  const handleChange = (idx: number, field: string, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => setRows((prev) => [...prev, { nom: "", email: "", fonction: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const valid = rows.filter((r) => r.nom && r.email);
      if (valid.length === 0) throw new Error("Aucun utilisateur valide");
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}/users/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: valid })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ajout impossible");
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ajout en masse</h2>
            <p className="text-sm text-slate-500">
              Licences disponibles : {Math.max(licencesDisponibles, 0)}
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="overflow-auto rounded border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Nom & prénom</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Fonction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2">
                      <Input
                        value={row.nom}
                        onChange={(e) => handleChange(idx, "nom", e.target.value)}
                        placeholder="Nom complet"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="email"
                        value={row.email}
                        onChange={(e) => handleChange(idx, "email", e.target.value)}
                        placeholder="email@example.com"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.fonction}
                        onChange={(e) => handleChange(idx, "fonction", e.target.value)}
                        placeholder="Fonction (optionnel)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addRow}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
            >
              + Ajouter une ligne
            </button>
            <Button type="submit" disabled={loading || licencesDisponibles <= 0}>
              {loading ? "Ajout..." : "Créer ces utilisateurs"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal pour ajuster les licences
function LicencesModal({
  enterprise,
  onClose,
  onUpdated
}: {
  enterprise: EnterpriseAccount;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [licences, setLicences] = useState(enterprise.nombreUtilisateursInclus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/enterprises/${enterprise.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreUtilisateursInclus: licences })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mise à jour impossible");
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-slate-900">Licences</h2>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-1">
            <Label>Licences achetées</Label>
            <Input
              type="number"
              min={0}
              value={licences}
              onChange={(e) => setLicences(Number(e.target.value))}
            />
            <p className="text-xs text-slate-500">
              Utilisées : {enterprise._count?.users || 0} / {enterprise.nombreUtilisateursInclus}
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? "Enregistrement..." : "Mettre à jour"}
          </Button>
        </form>
      </div>
    </div>
  );
}
