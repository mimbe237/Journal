import { prisma } from "@/lib/config/prisma";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole, SubscriptionStatus } from "@prisma/client";
import Link from "next/link";
import { AddSubscriberModal } from "../AddSubscriberModal";

type SearchParams = Record<string, string | string[] | undefined>;

function parseParam(params: SearchParams, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

type Row = {
  id: string;
  nom: string | null;
  email: string;
  dateCreation: Date;
  latestStatus?: SubscriptionStatus | null;
  dateDebut?: Date | null;
  dateFin?: Date | null;
};

export default async function IndividualSubscribersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <div className="p-8 text-slate-700">Accès refusé</div>;
  }

  const q = parseParam(params, "q").toLowerCase().trim();
  const statusFilter = parseParam(params, "status") as "all" | SubscriptionStatus | "";

  const [users, enterprisesOptions] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: UserRole.ABONNE,
        enterpriseAccountId: null
      },
      orderBy: { dateCreation: "desc" },
      select: {
        id: true,
        nom: true,
        email: true,
        dateCreation: true,
        subscriptions: {
          take: 1,
          orderBy: { dateFin: "desc" },
          select: { statut: true, dateDebut: true, dateFin: true }
        }
      }
    }),
    prisma.enterpriseAccount.findMany({
      orderBy: { nom: "asc" },
      select: { id: true, nom: true }
    })
  ]);

  const rows: Row[] = users.map((u) => ({
    id: u.id,
    nom: u.nom,
    email: u.email,
    dateCreation: u.dateCreation,
    latestStatus: u.subscriptions[0]?.statut ?? null,
    dateDebut: u.subscriptions[0]?.dateDebut ?? null,
    dateFin: u.subscriptions[0]?.dateFin ?? null
  }));

  const matchesSearch = (text: string | null | undefined) => {
    if (!q) return true;
    return (text ?? "").toLowerCase().includes(q);
  };

  const filtered = rows.filter((row) => {
    if (statusFilter && statusFilter !== "all") {
      if (!row.latestStatus) return false;
      if (row.latestStatus !== statusFilter) return false;
    }
    return matchesSearch(row.nom) || matchesSearch(row.email);
  });

  const statusBadge = (statut: SubscriptionStatus | null | undefined) => {
    if (!statut) return <span className="text-xs text-slate-400">Aucun</span>;
    const palette =
      statut === "ACTIF"
        ? "bg-emerald-100 text-emerald-800"
        : statut === "EXPIRE"
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-100 text-amber-800";
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${palette}`}>{statut}</span>;
  };

  const formatDate = (d: Date) => new Date(d).toLocaleDateString("fr-FR");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Abonnés individuels</h1>
            <p className="text-sm text-slate-600">Abonnements non liés à une entreprise.</p>
          </div>
          <AddSubscriberModal enterprises={enterprisesOptions} />
        </div>

        <Card className="p-4">
          <form className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Recherche nom ou email"
              className="w-full md:max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <label className="text-sm text-slate-600 flex items-center gap-2">
              Statut
              <select
                name="status"
                defaultValue={statusFilter || "all"}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">Tous</option>
                <option value="ACTIF">Actif</option>
                <option value="EXPIRE">Expiré</option>
                <option value="SUSPENDU">Suspendu</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400"
            >
              Filtrer
            </button>
          </form>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">
            <div>Nom</div>
            <div>Email</div>
            <div>Créé le</div>
            <div>Début</div>
            <div>Fin</div>
            <div className="text-right">Statut</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">Aucun abonné individuel</div>
            ) : (
              filtered.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] items-center gap-3 px-4 py-3 text-sm text-slate-800"
                >
                  <div className="font-medium">
                    <Link href={`/admin/users/${row.id}`} className="hover:text-emerald-600 hover:underline">
                      {row.nom || "Sans nom"}
                    </Link>
                  </div>
                  <div className="text-slate-600 truncate" title={row.email}>{row.email}</div>
                  <div className="text-slate-500">{formatDate(row.dateCreation)}</div>
                  <div className="text-slate-500">{row.dateDebut ? formatDate(row.dateDebut) : "-"}</div>
                  <div className="text-slate-500">{row.dateFin ? formatDate(row.dateFin) : "-"}</div>
                  <div className="text-right">{statusBadge(row.latestStatus)}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
