"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary } from "@/components/ui/Button";
import { Input, Select, Label } from "@/components/ui/FormControls";

export default function ManualSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    type: "MENSUEL",
    periode: "12", // Default 12 months
    montant: "",
    devise: "XAF",
  });
  
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("nom", formData.nom);
      data.append("email", formData.email);
      data.append("type", formData.type);
      data.append("periode", formData.periode);
      data.append("montant", formData.montant);
      data.append("devise", formData.devise);

      if (files) {
        for (let i = 0; i < files.length; i++) {
          data.append("justificatifs", files[i]);
          // Default type for now, could add UI to select type per file
          data.append("justificatifTypes", "RECU_CAISSE"); 
        }
      }

      const res = await fetch("/api/subscriptions/manual/submit", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erreur lors de la soumission");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-xl">
          <Card className="text-center p-8">
            <h2 className="text-2xl font-bold text-emerald-600 mb-4">Demande envoyée !</h2>
            <p className="text-slate-600 mb-6">
              Votre demande d'abonnement a bien été reçue. Notre équipe va l'examiner et valider votre accès dans les plus brefs délais.
            </p>
            <ButtonPrimary onClick={() => router.push("/")}>Retour à l'accueil</ButtonPrimary>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Abonnement Manuel"
          subtitle="Soumettez votre demande d'abonnement avec justificatif de paiement."
        />

        <Card className="mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                  id="nom"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="type">Type d'abonnement</Label>
                <Select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="MENSUEL">Mensuel</option>
                  <option value="ANNUEL">Annuel</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="periode">Durée (mois)</Label>
                <Input
                  id="periode"
                  type="number"
                  required
                  value={formData.periode}
                  onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="montant">Montant payé</Label>
                <Input
                  id="montant"
                  type="number"
                  required
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="devise">Devise</Label>
                <Select
                  id="devise"
                  value={formData.devise}
                  onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
                >
                  <option value="XAF">XAF (FCFA)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="files">Justificatif de paiement (Reçu, Virement...)</Label>
              <input
                id="files"
                type="file"
                multiple
                required
                className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                onChange={(e) => setFiles(e.target.files)}
              />
              <p className="mt-1 text-xs text-slate-500">Formats acceptés: PDF, JPG, PNG.</p>
            </div>

            <div className="pt-4">
              <ButtonPrimary type="submit" disabled={loading} className="w-full justify-center">
                {loading ? "Envoi en cours..." : "Soumettre la demande"}
              </ButtonPrimary>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
