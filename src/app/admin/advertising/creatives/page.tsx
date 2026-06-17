"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon, PencilIcon, TrashIcon, ImageIcon, EyeIcon } from "lucide-react";

interface Campaign { id: string; name: string; advertiser: { name: string } }
interface Creative {
  id: string;
  campaignId: string;
  campaign: { name: string; advertiser: { name: string } };
  name: string;
  imageUrl: string;
  clickUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  isActive: boolean;
}

export default function CreativesPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ campaignId: "", name: "", imageUrl: "", clickUrl: "", altText: "", width: 600, height: 200 });
  const [saving, setSaving] = useState(false);
  const [previewCreative, setPreviewCreative] = useState<Creative | null>(null);

  useEffect(() => { fetchCreatives(); fetchCampaigns(); }, []);

  async function fetchCreatives() {
    try {
      const res = await fetch("/api/admin/advertising/creatives");
      if (res.ok) setCreatives((await res.json()).creatives || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/admin/advertising/campaigns");
      if (res.ok) setCampaigns((await res.json()).campaigns || []);
    } catch { /* ignore */ }
  }

  function openCreateForm() {
    setFormData({ campaignId: campaigns[0]?.id || "", name: "", imageUrl: "", clickUrl: "", altText: "", width: 600, height: 200 });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(creative: Creative) {
    setFormData({ campaignId: creative.campaignId, name: creative.name, imageUrl: creative.imageUrl, clickUrl: creative.clickUrl, altText: creative.altText || "", width: creative.width || 600, height: creative.height || 200 });
    setEditingId(creative.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/advertising/creatives/${editingId}` : "/api/admin/advertising/creatives";
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error();
      setShowForm(false);
      fetchCreatives();
    } catch { alert("Erreur"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ?")) return;
    await fetch(`/api/admin/advertising/creatives/${id}`, { method: "DELETE" });
    fetchCreatives();
  }

  async function toggleActive(creative: Creative) {
    await fetch(`/api/admin/advertising/creatives/${creative.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !creative.isActive }) });
    fetchCreatives();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold">Créatifs</h2><p className="text-sm text-gray-500">Gérez les bannières et visuels publicitaires.</p></div>
        <Button onClick={openCreateForm} disabled={campaigns.length === 0}><PlusIcon className="h-4 w-4 mr-2" />Nouveau créatif</Button>
      </div>

      {campaigns.length === 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">Créez d&apos;abord une campagne.</div>}

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifier" : "Nouveau créatif"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Campagne *</label><select value={formData.campaignId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, campaignId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.advertiser.name})</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} required /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">URL de l&apos;image *</label><input type="url" className="w-full px-3 py-2 border rounded-lg" value={formData.imageUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, imageUrl: e.target.value})} required /><p className="text-xs text-gray-500 mt-1">Dimensions: 600x200px</p></div>
            <div><label className="block text-sm font-medium mb-1">URL de destination *</label><input type="url" className="w-full px-3 py-2 border rounded-lg" value={formData.clickUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, clickUrl: e.target.value})} required /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Alt text</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.altText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, altText: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Largeur</label><input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.width} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, width: parseInt(e.target.value) || 600})} /></div>
              <div><label className="block text-sm font-medium mb-1">Hauteur</label><input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.height} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, height: parseInt(e.target.value) || 200})} /></div>
            </div>
            {formData.imageUrl && <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm font-medium mb-2">Aperçu:</p><div className="flex justify-center"><img src={formData.imageUrl} alt={formData.altText || "Aperçu"} className="max-w-full h-auto rounded border" style={{maxWidth: formData.width, maxHeight: formData.height}} /></div></div>}
            <div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}>{saving ? "..." : "Enregistrer"}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button></div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creatives.length === 0 ? <Card className="col-span-full py-12 text-center text-gray-500">Aucun créatif.</Card> : creatives.map((creative) => (
          <Card key={creative.id} className="p-0 overflow-hidden">
            <div className="aspect-[3/1] bg-gray-100 relative">
              {creative.imageUrl ? <img src={creative.imageUrl} alt={creative.altText || creative.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-12 w-12 text-gray-300" /></div>}
              <div className="absolute top-2 right-2"><button onClick={() => setPreviewCreative(creative)} className="bg-white/90 hover:bg-white p-1.5 rounded shadow"><EyeIcon className="h-4 w-4" /></button></div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div><h4 className="font-medium">{creative.name}</h4><p className="text-xs text-gray-500">{creative.campaign.name}</p></div>
                <button onClick={() => toggleActive(creative)} className={`text-xs px-2 py-0.5 rounded-full ${creative.isActive ? "bg-green-100 text-green-800" : "bg-gray-100"}`}>{creative.isActive ? "Actif" : "Inactif"}</button>
              </div>
              {creative.width && creative.height && <p className="text-xs text-gray-500 mb-2">{creative.width}×{creative.height}px</p>}
              <div className="flex items-center justify-between pt-2 border-t">
                <a href={creative.clickUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 truncate max-w-[150px]">{creative.clickUrl}</a>
                <div className="flex gap-1"><button onClick={() => openEditForm(creative)} className="p-1 text-gray-400 hover:text-gray-600"><PencilIcon className="h-4 w-4" /></button><button onClick={() => handleDelete(creative.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {previewCreative && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewCreative(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between"><h3 className="font-semibold">{previewCreative.name}</h3><button onClick={() => setPreviewCreative(null)} className="text-gray-400 hover:text-gray-600">✕</button></div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">Aperçu email avec bannière:</p>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="max-w-[600px] mx-auto bg-white rounded shadow-sm">
                  <div className="p-4 border-b"><div className="h-8 bg-gray-200 rounded w-32 mb-2"></div><div className="h-4 bg-gray-100 rounded w-48"></div></div>
                  <div className="p-4"><div className="h-4 bg-gray-100 rounded w-full mb-2"></div><div className="h-4 bg-gray-100 rounded w-3/4 mb-4"></div></div>
                  <div className="px-4 py-6 bg-gray-50"><a href={previewCreative.clickUrl} target="_blank" rel="noopener noreferrer"><img src={previewCreative.imageUrl} alt={previewCreative.altText || "Pub"} className="w-full rounded" /></a><p className="text-center text-xs text-gray-400 mt-2">Publicité</p></div>
                  <div className="p-4"><div className="h-4 bg-gray-100 rounded w-full mb-2"></div><div className="h-4 bg-gray-100 rounded w-2/3"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
