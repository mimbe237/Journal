"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary } from "@/components/ui/Button";
import { DeleteButton } from "@/components/admin/DeleteButton";

type Edition = {
  id: string;
  titre: string;
  datePublication: string;
  type: string;
  nombrePages: number | null;
  cheminImageUne: string | null;
};

export default function EditionsListPage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdition, setSelectedEdition] = useState<Edition | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState<'cover' | 'details' | null>(null);
  const [editFormData, setEditFormData] = useState({
    titre: '',
    datePublication: '',
    type: 'PAPIER'
  });

  useEffect(() => {
    fetchEditions();
  }, []);

  async function fetchEditions() {
    try {
      const res = await fetch("/api/admin/editions");
      if (res.ok) {
        const data = await res.json();
        setEditions(data.editions || []);
      }
    } catch (err) {
      console.error("Erreur chargement éditions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadCover(editionId: string) {
    if (!coverImage) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("coverImage", coverImage);

      const res = await fetch(`/api/admin/editions/${editionId}/cover`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Échec upload");

      alert("Image de une mise à jour !");
      setCoverImage(null);
      setSelectedEdition(null);
      fetchEditions();
    } catch (err: any) {
      alert(err.message || "Erreur upload");
    } finally {
      setUploading(false);
    }
  }

  const handleUpdateDetails = async (editionId: string) => {
    try {
      setUploading(true);

      const res = await fetch(`/api/admin/editions/${editionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: editFormData.titre,
          datePublication: editFormData.datePublication,
          type: editFormData.type,
        }),
      });

      if (!res.ok) throw new Error("Échec mise à jour");

      alert("Édition mise à jour !");
      setSelectedEdition(null);
      setEditMode(null);
      fetchEditions();
    } catch (err: any) {
      alert(err.message || "Erreur mise à jour");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gérer les éditions</h1>
            <p className="mt-2 text-slate-600">Modifier les couvertures et gérer vos publications</p>
          </div>
          <Link href="/admin/editions">
            <ButtonPrimary>+ Nouvelle édition</ButtonPrimary>
          </Link>
        </div>

        {loading ? (
          <Card className="bg-white p-8 text-center text-slate-500">
            Chargement...
          </Card>
        ) : editions.length === 0 ? (
          <Card className="bg-white p-8 text-center text-slate-500">
            Aucune édition trouvée
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {editions.map((edition) => (
              <Card key={edition.id} className="bg-white p-4 hover:shadow-lg transition">
                <div className="space-y-3">
                  {/* Image de Une */}
                  <div className="aspect-[3/4] overflow-hidden rounded-lg bg-slate-700">
                    {edition.cheminImageUne ? (
                      <img
                        src={`/api/files/${edition.cheminImageUne}`}
                        alt={edition.titre}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='267'%3E%3Crect fill='%23475569' width='200' height='267'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23cbd5e1' font-size='16'%3EPas de une%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                        Pas d'image
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div>
                    <h3 className="font-semibold text-slate-900">{edition.titre}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(edition.datePublication).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {edition.type} • {edition.nombrePages || 0} pages
                    </p>
                  </div>

                  {/* Boutons d'action */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setSelectedEdition(edition);
                        setEditMode('cover');
                      }}
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 transition-colors"
                    >
                      Modifier la une
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEdition(edition);
                        setEditFormData({
                          titre: edition.titre,
                          datePublication: new Date(edition.datePublication).toISOString().split('T')[0],
                          type: edition.type
                        });
                        setEditMode('details');
                      }}
                      className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                    >
                      Modifier les infos
                    </button>
                    <DeleteButton
                      type="edition"
                      id={edition.id}
                      name={edition.titre}
                      onDeleted={fetchEditions}
                      size="md"
                      className="w-full justify-center"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal pour modifier la couverture */}
        {selectedEdition && editMode === 'cover' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-w-md w-full bg-white p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Modifier la une
              </h2>
              <p className="text-sm text-slate-600">
                {selectedEdition.titre}
              </p>

              {/* Upload */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
                  className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600 file:rounded file:border-0 file:bg-emerald-600 file:px-3 file:py-1 file:text-white hover:border-emerald-500"
                />
                {coverImage && (
                  <div className="mt-3">
                    <p className="text-sm text-emerald-600 mb-2">✓ {coverImage.name}</p>
                    <img
                      src={URL.createObjectURL(coverImage)}
                      alt="Aperçu"
                      className="h-48 w-auto rounded border border-slate-300 mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedEdition(null);
                    setCoverImage(null);
                  }}
                  className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-slate-900 hover:bg-slate-300"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <ButtonPrimary
                  onClick={() => handleUploadCover(selectedEdition.id)}
                  disabled={!coverImage || uploading}
                  className="flex-1"
                >
                  {uploading ? "Upload..." : "Mettre à jour"}
                </ButtonPrimary>
              </div>
            </Card>
          </div>
        )}

        {/* Modal pour modifier les infos */}
        {selectedEdition && editMode === 'details' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="max-w-md w-full bg-white p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Modifier les infos
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={editFormData.titre}
                    onChange={(e) => setEditFormData({ ...editFormData, titre: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre de l'édition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Date de publication
                  </label>
                  <input
                    type="date"
                    value={editFormData.datePublication}
                    onChange={(e) => setEditFormData({ ...editFormData, datePublication: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PAPIER">Papier</option>
                    <option value="NUMERIQUE">Numérique</option>
                    <option value="SPECIAL">Spécial</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedEdition(null);
                    setEditMode(null);
                  }}
                  className="flex-1 rounded-lg bg-slate-200 px-4 py-2 text-slate-900 hover:bg-slate-300"
                  disabled={uploading}
                >
                  Annuler
                </button>
                <ButtonPrimary
                  onClick={() => handleUpdateDetails(selectedEdition.id)}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? "Sauvegarde..." : "Sauvegarder"}
                </ButtonPrimary>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
