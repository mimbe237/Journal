"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon, PencilIcon, PlayIcon, PauseIcon, BarChart2Icon } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  advertiserId: string;
  advertiser: { name: string };
  status: string;
  channels: string[];
  budgetTotal: number;
  budgetSpent: number;
  startDate: string;
  endDate: string | null;
  _count?: { impressions: number; clicks: number };
}

const CHANNELS = [
  { value: "EMAIL_EDITION", label: "Email Édition" },
  { value: "EMAIL_NEWSLETTER", label: "Newsletter" },
  { value: "IN_APP_BANNER", label: "Bannière In-App" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-800" },
  PAUSED: { label: "En pause", color: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "Terminée", color: "bg-blue-100 text-blue-800" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-800" },
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", advertiserId: "", channels: ["EMAIL_EDITION"], budgetTotal: 0, startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { fetchCampaigns(); fetchAdvertisers(); }, [filterStatus]);

  async function fetchCampaigns() {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/advertising/campaigns?${params}`);
      if (res.ok) setCampaigns((await res.json()).campaigns || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function fetchAdvertisers() {
    try {
      const res = await fetch("/api/admin/advertising/advertisers?isActive=true");
      if (res.ok) setAdvertisers((await res.json()).advertisers || []);
    } catch { /* ignore */ }
  }

  function openCreateForm() {
    setFormData({ name: "", advertiserId: advertisers[0]?.id || "", channels: ["EMAIL_EDITION"], budgetTotal: 0, startDate: new Date().toISOString().split("T")[0], endDate: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(camp: Campaign) {
    setFormData({ name: camp.name, advertiserId: camp.advertiserId, channels: camp.channels, budgetTotal: camp.budgetTotal, startDate: camp.startDate.split("T")[0], endDate: camp.endDate?.split("T")[0] || "" });
    setEditingId(camp.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/advertising/campaigns/${editingId}` : "/api/admin/advertising/campaigns";
      const body = { ...formData, startDate: new Date(formData.startDate).toISOString(), endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null };
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setShowForm(false);
      fetchCampaigns();
    } catch { alert("Erreur"); } finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/advertising/campaigns/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchCampaigns();
  }

  function toggleChannel(channel: string) {
    setFormData((prev) => ({ ...prev, channels: prev.channels.includes(channel) ? prev.channels.filter((c) => c !== channel) : [...prev.channels, channel] }));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold">Campagnes</h2><p className="text-sm text-gray-500">Gérez vos campagnes publicitaires.</p></div>
        <Button onClick={openCreateForm} disabled={advertisers.length === 0}><PlusIcon className="h-4 w-4 mr-2" />Nouvelle campagne</Button>
      </div>

      {advertisers.length === 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">Créez d&apos;abord un annonceur.</div>}

      <div className="flex gap-2">
        <select value={filterStatus} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
        </select>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifier" : "Nouvelle campagne"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium mb-1">Annonceur *</label><select value={formData.advertiserId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, advertiserId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>{advertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium mb-2">Canaux *</label><div className="flex flex-wrap gap-2">{CHANNELS.map((ch) => <button key={ch.value} type="button" onClick={() => toggleChannel(ch.value)} className={`px-3 py-1 rounded-full text-sm ${formData.channels.includes(ch.value) ? "bg-green-600 text-white" : "bg-gray-100"}`}>{ch.label}</button>)}</div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium mb-1">Budget (XOF)</label><input type="number" className="w-full px-3 py-2 border rounded-lg" value={formData.budgetTotal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, budgetTotal: parseInt(e.target.value) || 0})} min={0} /></div>
              <div><label className="block text-sm font-medium mb-1">Début *</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, startDate: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium mb-1">Fin</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={formData.endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, endDate: e.target.value})} /></div>
            </div>
            <div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}>{saving ? "..." : "Enregistrer"}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button></div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        {campaigns.length === 0 ? <div className="py-12 text-center text-gray-500">Aucune campagne.</div> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campagne</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annonceur</th><th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Canaux</th><th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Perf.</th><th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((camp) => (
                <tr key={camp.id}>
                  <td className="px-4 py-3"><div className="font-medium">{camp.name}</div><div className="text-xs text-gray-500">{new Date(camp.startDate).toLocaleDateString("fr-FR")}{camp.endDate && ` - ${new Date(camp.endDate).toLocaleDateString("fr-FR")}`}</div></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{camp.advertiser.name}</td>
                  <td className="px-4 py-3 text-center"><div className="flex flex-wrap justify-center gap-1">{camp.channels.map((ch) => <span key={ch} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{CHANNELS.find((c) => c.value === ch)?.label || ch}</span>)}</div></td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded-full ${STATUS_LABELS[camp.status]?.color || "bg-gray-100"}`}>{STATUS_LABELS[camp.status]?.label || camp.status}</span></td>
                  <td className="px-4 py-3 text-right text-sm"><div>{camp.budgetSpent.toLocaleString()} / {camp.budgetTotal.toLocaleString()} XOF</div>{camp.budgetTotal > 0 && <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-green-600 h-1.5 rounded-full" style={{width: `${Math.min((camp.budgetSpent/camp.budgetTotal)*100, 100)}%`}} /></div>}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500"><div>{camp._count?.impressions || 0} imp.</div><div>{camp._count?.clicks || 0} clics</div></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {camp.status === "ACTIVE" && <button onClick={() => updateStatus(camp.id, "PAUSED")} className="text-yellow-600 p-1"><PauseIcon className="h-4 w-4" /></button>}
                      {(camp.status === "DRAFT" || camp.status === "PAUSED") && <button onClick={() => updateStatus(camp.id, "ACTIVE")} className="text-green-600 p-1"><PlayIcon className="h-4 w-4" /></button>}
                      <button onClick={() => openEditForm(camp)} className="text-gray-400 p-1"><PencilIcon className="h-4 w-4" /></button>
                      <a href={`/admin/advertising/campaigns/${camp.id}`} className="text-blue-600 p-1"><BarChart2Icon className="h-4 w-4" /></a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
