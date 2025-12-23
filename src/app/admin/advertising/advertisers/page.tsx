"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";

interface Advertiser {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { campaigns: number };
}

export default function AdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", contactEmail: "", contactPhone: "", website: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAdvertisers(); }, []);

  async function fetchAdvertisers() {
    try {
      const res = await fetch("/api/admin/advertising/advertisers");
      if (res.ok) setAdvertisers((await res.json()).advertisers || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  function openCreateForm() {
    setFormData({ name: "", contactEmail: "", contactPhone: "", website: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(adv: Advertiser) {
    setFormData({ name: adv.name, contactEmail: adv.contactEmail, contactPhone: adv.contactPhone || "", website: adv.website || "" });
    setEditingId(adv.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/advertising/advertisers/${editingId}` : "/api/admin/advertising/advertisers";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error();
      setShowForm(false);
      fetchAdvertisers();
    } catch { alert("Erreur"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ?")) return;
    await fetch(`/api/admin/advertising/advertisers/${id}`, { method: "DELETE" });
    fetchAdvertisers();
  }

  async function toggleActive(adv: Advertiser) {
    await fetch(`/api/admin/advertising/advertisers/${adv.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !adv.isActive }) });
    fetchAdvertisers();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold">Annonceurs</h2><p className="text-sm text-gray-500">Gérez les partenaires publicitaires.</p></div>
        <Button onClick={openCreateForm}><PlusIcon className="h-4 w-4 mr-2" />Nouvel annonceur</Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifier" : "Nouvel annonceur"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" className="w-full px-3 py-2 border rounded-lg" value={formData.contactEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, contactEmail: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium mb-1">Téléphone</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.contactPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, contactPhone: e.target.value})} /></div>
            <div><label className="block text-sm font-medium mb-1">Site web</label><input type="url" className="w-full px-3 py-2 border rounded-lg" value={formData.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, website: e.target.value})} /></div>
            <div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}>{saving ? "..." : "Enregistrer"}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button></div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        {advertisers.length === 0 ? <div className="py-12 text-center text-gray-500">Aucun annonceur.</div> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th><th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Campagnes</th><th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {advertisers.map((adv) => (
                <tr key={adv.id}>
                  <td className="px-4 py-3"><div className="font-medium">{adv.name}</div>{adv.website && <a href={adv.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">{adv.website}</a>}</td>
                  <td className="px-4 py-3 text-sm text-gray-500"><div>{adv.contactEmail}</div>{adv.contactPhone && <div className="text-xs">{adv.contactPhone}</div>}</td>
                  <td className="px-4 py-3 text-center text-sm">{adv._count?.campaigns || 0}</td>
                  <td className="px-4 py-3 text-center"><button onClick={() => toggleActive(adv)} className={`px-2 py-1 text-xs rounded-full ${adv.isActive ? "bg-green-100 text-green-800" : "bg-gray-100"}`}>{adv.isActive ? "Actif" : "Inactif"}</button></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => openEditForm(adv)} className="p-1 text-gray-400 hover:text-gray-600"><PencilIcon className="h-4 w-4" /></button><button onClick={() => handleDelete(adv.id)} className="p-1 ml-2 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
