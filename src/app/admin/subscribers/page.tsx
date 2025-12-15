import Link from "next/link";
import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole, SubscriptionStatus } from "@prisma/client";
import { ImportSubscribersModal } from "./ImportSubscribersModal";
import { EditUserModal } from "../users/EditUserModal";

const subscriberRoles: UserRole[] = [UserRole.ABONNE, UserRole.COMPTE_ENTREPRISE, UserRole.UTILISATEUR_ENTREPRISE];
const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];

type SearchParams = Record<string, string | string[] | undefined>;

function parseParam(params: SearchParams, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

type Row = {
  id: string;
  nom: string | null;
  email: string;
  role: UserRole;
  dateCreation: Date;
  enterprise?: {
    id: string;
    nom: string;
    latestStatus?: SubscriptionStatus | null;
    dateDebut?: Date;
    dateFin?: Date;
  } | null;
  latestStatus?: SubscriptionStatus | null;
  dateDebut?: Date;
  dateFin?: Date;
};

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <div className="p-8 text-slate-700">Accès refusé</div>;
  }

  const q = parseParam(params, "q").toLowerCase().trim();
  const successMsg = parseParam(params, "success") ? "Abonné créé avec succès." : "";

  const parseMulti = (key: string) => {
    const raw = params[key];
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.flatMap((v) => v.split(","));
    return raw.split(",");
  };

  const typeFilterList = parseMulti("type").filter(Boolean) as Array<"individu" | "entreprise">;
  const statusFilterList = parseMulti("status").filter(Boolean) as SubscriptionStatus[];
  const enterpriseFilter = parseParam(params, "enterpriseId");

  await prismaRuntimeReady;

  const [users, enterprisesOptions] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: subscriberRoles } },
      orderBy: { dateCreation: "desc" },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        dateCreation: true,
        subscriptions: {
          take: 1,
          orderBy: { dateFin: "desc" },
          select: {
            statut: true,
            dateDebut: true,
            dateFin: true
          }
        },
        enterpriseAccount: {
          select: {
            id: true,
            nom: true,
            subscriptions: {
              take: 1,
              orderBy: { dateFin: "desc" },
              select: { 
                statut: true,
                dateDebut: true,
                dateFin: true
              }
            }
          }
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
    role: u.role,
    dateCreation: u.dateCreation,
    latestStatus: u.subscriptions[0]?.statut ?? null,
    dateDebut: u.subscriptions[0]?.dateDebut,
    dateFin: u.subscriptions[0]?.dateFin,
    enterprise: u.enterpriseAccount
      ? {
          id: u.enterpriseAccount.id,
          nom: u.enterpriseAccount.nom,
          latestStatus: u.enterpriseAccount.subscriptions[0]?.statut ?? null,
          dateDebut: u.enterpriseAccount.subscriptions[0]?.dateDebut,
          dateFin: u.enterpriseAccount.subscriptions[0]?.dateFin
        }
      : null
  }));

  const matchesSearch = (text: string | null | undefined) => {
    if (!q) return true;
    return (text ?? "").toLowerCase().includes(q);
  };

  const filtered = rows.filter((row) => {
    const isEnterprise = Boolean(row.enterprise);
    if (typeFilterList.length) {
      if (typeFilterList.includes("individu") && typeFilterList.includes("entreprise")) {
        // both allowed
      } else if (typeFilterList.includes("individu") && isEnterprise) return false;
      else if (typeFilterList.includes("entreprise") && !isEnterprise) return false;
    }

    if (enterpriseFilter && row.enterprise?.id !== enterpriseFilter) return false;

    const statusToCheck = row.enterprise ? row.enterprise.latestStatus ?? row.latestStatus : row.latestStatus;
    if (statusFilterList.length) {
      if (!statusToCheck) return false;
      if (!statusFilterList.includes(statusToCheck)) return false;
    }

    const inSearch =
      matchesSearch(row.nom) ||
      matchesSearch(row.email) ||
      matchesSearch(row.enterprise?.nom);
    return inSearch;
  });

  const formatDate = (d: Date) => new Date(d).toLocaleDateString("fr-FR");

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

  const typeBadge = (row: Row) => {
    const isEnterprise = Boolean(row.enterprise);
    const text = isEnterprise
      ? row.role === UserRole.COMPTE_ENTREPRISE
        ? "Admin Ent."
        : "Entreprise"
      : "Individuel";
    const palette = isEnterprise ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700";
    return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${palette} whitespace-nowrap`}>{text}</span>;
  };

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Tous les abonnés</h1>
            <p className="text-sm text-slate-600">Vue globale avec distinction entreprise/individuel.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/subscribers/new"
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              + Nouvel abonné
            </Link>
            {currentUser.role === UserRole.SUPER_ADMIN && <ImportSubscribersModal />}
          </div>
        </div>

        {successMsg && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMsg}
          </div>
        )}

        <Card className="p-4 md:p-6">
          <form className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Recherche nom, email, entreprise..."
              className="w-full md:max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />

            {isSuperAdmin ? (
              <>
                <div className="flex flex-col text-sm text-slate-700 gap-1">
                  <span className="text-xs font-semibold text-slate-600">Type</span>
                  <div className="flex gap-3">
                    {[
                      { val: "individu", label: "Individuel" },
                      { val: "entreprise", label: "Entreprise" }
                    ].map((opt) => (
                      <label key={opt.val} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="type"
                          value={opt.val}
                          defaultChecked={typeFilterList.includes(opt.val as any)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col text-sm text-slate-700 gap-1">
                  <span className="text-xs font-semibold text-slate-600">Statut</span>
                  <div className="flex gap-3">
                    {["ACTIF", "EXPIRE", "SUSPENDU"].map((opt) => (
                      <label key={opt} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="status"
                          value={opt}
                          defaultChecked={statusFilterList.includes(opt as SubscriptionStatus)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <label className="text-sm text-slate-600 flex items-center gap-2">
                  Type
                  <select
                    name="type"
                    defaultValue={typeFilterList[0] || "all"}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="all">Tous</option>
                    <option value="individu">Individuel</option>
                    <option value="entreprise">Entreprise</option>
                  </select>
                </label>
                <label className="text-sm text-slate-600 flex items-center gap-2">
                  Statut
                  <select
                    name="status"
                    defaultValue={statusFilterList[0] || "all"}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="all">Tous</option>
                    <option value="ACTIF">Actif</option>
                    <option value="EXPIRE">Expiré</option>
                    <option value="SUSPENDU">Suspendu</option>
                  </select>
                </label>
              </>
            )}

            <label className="text-sm text-slate-600 flex items-center gap-2">
              Entreprise (ID)
              <input
                type="text"
                name="enterpriseId"
                defaultValue={enterpriseFilter}
                placeholder="ID entreprise (optionnel)"
                className="w-full md:max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
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
          <div className="grid grid-cols-[1.5fr_1.5fr_1fr_0.8fr_1.2fr_0.8fr_0.5fr] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">
            <div>Nom</div>
            <div>Email</div>
            <div>Entreprise</div>
            <div>Type</div>
            <div>Période</div>
            <div className="text-right">Statut</div>
            <div className="text-right">Action</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">Aucun abonné</div>
            ) : (
              filtered.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1.5fr_1.5fr_1fr_0.8fr_1.2fr_0.8fr_0.5fr] items-center gap-3 px-4 py-3 text-sm text-slate-800"
                >
                  <div className="font-medium">
                    <Link href={`/admin/users/${row.id}`} className="hover:text-emerald-600 hover:underline">
                      {row.nom || "Sans nom"}
                    </Link>
                    <div className="text-xs text-slate-500">{formatDate(row.dateCreation)}</div>
                  </div>
                  <div className="text-slate-600 truncate" title={row.email}>{row.email}</div>
                  <div className="text-slate-700 truncate" title={row.enterprise?.nom}>
                    {row.enterprise ? (
                      <Link
                        href={`/admin/enterprises/${row.enterprise.id}`}
                        className="hover:text-emerald-600 hover:underline"
                      >
                        {row.enterprise.nom}
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">Aucune</span>
                    )}
                  </div>
                  <div>{typeBadge(row)}</div>
                  <div className="text-xs text-slate-500">
                    {(() => {
                      const start = row.enterprise ? row.enterprise.dateDebut : row.dateDebut;
                      const end = row.enterprise ? row.enterprise.dateFin : row.dateFin;
                      if (!start || !end) return <span className="text-slate-400">-</span>;
                      return (
                        <div className="flex flex-col">
                          <span>Du {formatDate(start)}</span>
                          <span>Au {formatDate(end)}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-right">
                    {statusBadge(row.enterprise ? row.enterprise.latestStatus ?? row.latestStatus : row.latestStatus)}
                  </div>
                  <div className="text-right">
                    {isSuperAdmin && (
                      <EditUserModal user={row} allRoles={Object.values(UserRole)} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
