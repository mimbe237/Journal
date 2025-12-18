import { prisma } from "@/lib/config/prisma";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { EmailVariablesGuide } from "@/components/admin/emails/EmailVariablesGuide";

const ALLOWED_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT];

export default async function EmailTemplatesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !ALLOWED_ROLES.includes(currentUser.role)) {
    return <div className="p-8 text-slate-700">Accès refusé</div>;
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      layout: { select: { nom: true } },
      _count: { select: { sends: true, versions: true } }
    }
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-amber-100 text-amber-800",
    PUBLISHED: "bg-emerald-100 text-emerald-800",
    ARCHIVED: "bg-slate-100 text-slate-600"
  };

  const categoryColors: Record<string, string> = {
    TRANSACTIONAL: "bg-blue-100 text-blue-800",
    MARKETING: "bg-purple-100 text-purple-800",
    NOTIFICATION: "bg-cyan-100 text-cyan-800",
    SYSTEM: "bg-slate-100 text-slate-700"
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Modèles d'emails</h1>
            <p className="text-sm text-slate-600">Créez et personnalisez vos modèles d'emails.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/emails/templates/new"
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              + Nouveau modèle
            </Link>
            <EmailVariablesGuide />
            <Link
              href="/admin/emails/layouts"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Layouts
            </Link>
            <Link
              href="/admin/emails/logs"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Historique
            </Link>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Aucun modèle</h3>
            <p className="mt-2 text-sm text-slate-600">
              Créez votre premier modèle d'email pour commencer.
            </p>
            <Link
              href="/admin/emails/templates/new"
              className="mt-4 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Créer un modèle
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <div>Modèle</div>
              <div>Catégorie</div>
              <div>Statut</div>
              <div>Layout</div>
              <div className="text-right">Envois</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-100">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-4 px-6 py-4 hover:bg-slate-50"
                >
                  <div>
                    <Link
                      href={`/admin/emails/templates/${template.id}`}
                      className="font-medium text-slate-900 hover:text-emerald-600"
                    >
                      {template.nom}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {template.slug} • {template.locale.toUpperCase()}
                    </div>
                    {template.description && (
                      <div className="mt-1 text-xs text-slate-400 truncate max-w-xs">
                        {template.description}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${categoryColors[template.category]}`}>
                      {template.category}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[template.status]}`}>
                      {template.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {template.layout?.nom || <span className="text-slate-400">—</span>}
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    {template._count.sends}
                    <span className="text-xs text-slate-400 ml-1">
                      ({template._count.versions} v.)
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/emails/templates/${template.id}`}
                      className="rounded px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                    >
                      Éditer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
