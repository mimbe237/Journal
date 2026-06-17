"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from "lucide-react";

interface AudienceSegment {
  id: string;
  name: string;
  description: string | null;
  filters: { organizationTypes?: string[]; organizationSizes?: string[]; interests?: string[]; regions?: string[]; };
  isActive: boolean;
  estimatedSize: number;
}

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

export default function AudiencesPage() {
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", organizationTypes: [] as string[], organizationSizes: [] as string[], interests: [] as string[], regions: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);

  useEffect(() => { fetchSegments(); }, []);

  async function fetchSegments() {
    try {
      const res = await fetch("/api/admin/advertising/audiences");
      if (res.ok) setSegments((await res.json()).segments || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  function openCreateForm() {
    setFormData({ name: "", description: "", organizationTypes: [], organizationSizes: [], interests: [], regions: [] });
    setEditingId(null);
    setEstimatedSize(null);
    setShowForm(true);
  }

  function openEditForm(seg: AudienceSegment) {
    setFormData({ name: seg.name, description: seg.description || "", organizationTypes: seg.filters.organizationTypes || [], organizationSizes: seg.filters.organizationSizes || [], interests: seg.filters.interests || [], regions: seg.filters.regions || [] });
    setEditingId(seg.id);
    setEstimatedSize(seg.estimatedSize);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/advertising/audiences/${editingId}` : "/api/admin/advertising/audiences";
      const body = { name: formData.name, description: formData.description || null, filters: { organizationTypes: formData.organizationTypes, organizationSizes: formData.organizationSizes, interests: formData.interests, regions: formData.regions } };
      const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error();
      setShowForm(false);
      fetchSegments();
    } catch { alert("Erreur"); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ?")) return;
    await fetch(`/api/admin/advertising/audiences/${id}`, { method: "DELETE" });
    fetchSegments();
  }

  function toggleArrayValue(field: "organizationTypes" | "organizationSizes" | "interests", value: string) {
    setFormData((prev) => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter((v) => v !== value) : [...prev[field], value] }));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-semibold">Segments d&apos;audience</h2><p className="text-sm text-gray-500">Définissez des cibles pour vos campagnes.</p></div>
        <Button onClick={openCreateForm}><PlusIcon className="h-4 w-4 mr-2" />Nouveau segment</Button>
      </div>

      {showForm && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">{editingId ? "Modifier" : "Nouveau segment"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Nom *</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium mb-1">Description</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, description: e.target.value})} /></div>
            </div>
            <div><label className="block text-sm font-medium mb-2">Types d&apos;organisation</label><div className="flex flex-wrap gap-2">{ORG_TYPES.map((t) => <button key={t.value} type="button" onClick={() => toggleArrayValue("organizationTypes", t.value)} className={`px-3 py-1 rounded-full text-sm ${formData.organizationTypes.includes(t.value) ? "bg-green-600 text-white" : "bg-gray-100"}`}>{t.label}</button>)}</div></div>
            <div><label className="block text-sm font-medium mb-2">Tailles</label><div className="flex flex-wrap gap-2">{ORG_SIZES.map((s) => <button key={s.value} type="button" onClick={() => toggleArrayValue("organizationSizes", s.value)} className={`px-3 py-1 rounded-full text-sm ${formData.organizationSizes.includes(s.value) ? "bg-green-600 text-white" : "bg-gray-100"}`}>{s.label}</button>)}</div></div>
            <div><label className="block text-sm font-medium mb-2">Intérêts</label><div className="flex flex-wrap gap-2">{INTERESTS.map((i) => <button key={i.value} type="button" onClick={() => toggleArrayValue("interests", i.value)} className={`px-3 py-1 rounded-full text-sm ${formData.interests.includes(i.value) ? "bg-blue-600 text-white" : "bg-gray-100"}`}>{i.label}</button>)}</div></div>
            <div><label className="block text-sm font-medium mb-1">Régions (séparées par virgule)</label><input type="text" className="w-full px-3 py-2 border rounded-lg" value={formData.regions.join(", ")} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, regions: e.target.value.split(",").map((r: string) => r.trim()).filter(Boolean)})} placeholder="Centre, Littoral, Ouest" /></div>
            {estimatedSize !== null && <div className="p-4 bg-gray-50 rounded-lg"><UsersIcon className="h-4 w-4 inline mr-2" />~ {estimatedSize.toLocaleString()} utilisateurs</div>}
            <div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}>{saving ? "..." : "Enregistrer"}</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button></div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.length === 0 ? <Card className="col-span-full py-12 text-center text-gray-500">Aucun segment configuré.</Card> : segments.map((seg) => (
          <Card key={seg.id}>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold">{seg.name}</h4>
              <div className="flex gap-1"><button onClick={() => openEditForm(seg)} className="p-1 text-gray-400 hover:text-gray-600"><PencilIcon className="h-4 w-4" /></button><button onClick={() => handleDelete(seg.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="h-4 w-4" /></button></div>
            </div>
            {seg.description && <p className="text-sm text-gray-500 mb-3">{seg.description}</p>}
            <div className="space-y-1 text-sm">
              {(seg.filters.organizationTypes?.length ?? 0) > 0 && <div><span className="font-medium">Types: </span>{seg.filters.organizationTypes?.map((t) => ORG_TYPES.find((o) => o.value === t)?.label || t).join(", ")}</div>}
              {(seg.filters.organizationSizes?.length ?? 0) > 0 && <div><span className="font-medium">Tailles: </span>{seg.filters.organizationSizes?.map((s) => ORG_SIZES.find((o) => o.value === s)?.label || s).join(", ")}</div>}
              {(seg.filters.interests?.length ?? 0) > 0 && <div><span className="font-medium">Intérêts: </span>{seg.filters.interests?.map((i) => INTERESTS.find((o) => o.value === i)?.label || i).join(", ")}</div>}
              {(seg.filters.regions?.length ?? 0) > 0 && <div><span className="font-medium">Régions: </span>{seg.filters.regions?.join(", ")}</div>}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500"><UsersIcon className="h-4 w-4 inline mr-1" />{seg.estimatedSize.toLocaleString()} utilisateurs</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${seg.isActive ? "bg-green-100 text-green-800" : "bg-gray-100"}`}>{seg.isActive ? "Actif" : "Inactif"}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
