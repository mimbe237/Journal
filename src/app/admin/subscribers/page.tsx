import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole } from "@prisma/client";
import { CreateIndividualSubscriberButton } from "./CreateIndividualSubscriberButton";
import { CreateEnterpriseButton } from "./CreateEnterpriseButton";

const subscriberRoles: UserRole[] = [UserRole.ABONNE, UserRole.COMPTE_ENTREPRISE, UserRole.UTILISATEUR_ENTREPRISE];
const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];

type SearchParams = Record<string, string | string[] | undefined>;

function parseParam(params: SearchParams, key: string): string {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <div className="p-8 text-slate-700">Accès refusé</div>;
  }

  const q = parseParam(params, "q").toLowerCase().trim();
  const typeFilter = parseParam(params, "type") as
    | "all"
    | "ABONNE"
    | "COMPTE_ENTREPRISE"
    | "UTILISATEUR_ENTREPRISE"
    | "";
  const enterpriseStatus = parseParam(params, "enterpriseStatus") as "all" | "active" | "inactive" | "";
  const licenceUsage = parseParam(params, "licence") as "all" | "low" | "near" | "full" | "";

  const [individuals, enterprises] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: subscriberRoles } },
      orderBy: { dateCreation: "desc" },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        dateCreation: true,
        enterpriseAccount: {
          select: { id: true, nom: true }
        }
      }
    }),
    prisma.enterpriseAccount.findMany({
      orderBy: { dateCreation: "desc" },
      select: {
        id: true,
        nom: true,
        contactEmail: true,
        dateCreation: true,
        actif: true,
        nombreUtilisateursInclus: true,
        users: {
          select: { id: true }
        }
      }
    })
  ]);

  const matchesSearch = (text: string | null | undefined) => {
    if (!q) return true;
    return (text ?? "").toLowerCase().includes(q);
  };

  const filteredIndividuals = individuals.filter((user) => {
    if (typeFilter && typeFilter !== "all" && user.role !== typeFilter) return false;
    const inSearch =
      matchesSearch(user.nom) ||
      matchesSearch(user.email) ||
      matchesSearch(user.enterpriseAccount?.nom);
    return inSearch;
  });

  const filteredEnterprises = enterprises.filter((ent) => {
    if (enterpriseStatus === "active" && !ent.actif) return false;
    if (enterpriseStatus === "inactive" && ent.actif) return false;

    const usage = ent.users.length / ent.nombreUtilisateursInclus;
    if (licenceUsage === "low" && usage >= 0.5) return false; // moins de 50%
    if (licenceUsage === "near" && !(usage >= 0.75 && usage < 1)) return false; // 75-99%
    if (licenceUsage === "full" && usage < 1) return false; // plein

    const inSearch = matchesSearch(ent.nom) || matchesSearch(ent.contactEmail);
    return inSearch;
  });

  const formatDate = (d: Date) => new Date(d).toLocaleDateString("fr-FR");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Abonnés</h1>
            <p className="text-sm text-slate-600">Séparation Staff / Abonnés : entreprises et individuels.</p>
          </div>
          <div className="flex items-center gap-3">
            <CreateEnterpriseButton />
            <CreateIndividualSubscriberButton />
          </div>
        </div>

        <Card className="p-4 md:p-6">
          <form className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Recherche nom, email, entreprise..."
              className="w-full md:max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <label className="text-sm text-slate-600 flex items-center gap-2">
              Type
              <select
                name="type"
                defaultValue={typeFilter || "all"}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">Tous</option>
                <option value="ABONNE">Individuel</option>
                <option value="COMPTE_ENTREPRISE">Admin entreprise</option>
                <option value="UTILISATEUR_ENTREPRISE">Utilisateur entreprise</option>
              </select>
            </label>
            <label className="text-sm text-slate-600 flex items-center gap-2">
              Entreprise
              <select
                name="enterpriseStatus"
                defaultValue={enterpriseStatus || "all"}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">Actives + inactives</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </label>
            <label className="text-sm text-slate-600 flex items-center gap-2">
              Licences
              <select
                name="licence"
                defaultValue={licenceUsage || "all"}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">Toutes</option>
                <option value="low">Sous-utilisé (&lt;50%)</option>
                <option value="near">Quasi plein (75-99%)</option>
                <option value="full">Plein (100%)</option>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Comptes entreprise</h2>
                <p className="text-sm text-slate-500">B2B : accès multi-utilisateurs</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {filteredEnterprises.length} comptes
              </span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">
                <div>Entreprise</div>
                <div>Contact</div>
                <div>Créé le</div>
                <div className="text-right">Licences</div>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                {filteredEnterprises.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">Aucune entreprise</div>
                ) : (
                  filteredEnterprises.map((ent) => (
                    <div key={ent.id} className="grid grid-cols-[2fr_2fr_1fr_1fr] px-4 py-3 text-sm items-center">
                      <div className="font-medium">
                        <Link href={`/admin/enterprises/${ent.id}`} className="hover:text-emerald-600 hover:underline">
                          {ent.nom}
                        </Link>
                        <div className="text-xs text-slate-500">Statut : {ent.actif ? "Actif" : "Inactif"}</div>
                      </div>
                      <div className="text-slate-600">{ent.contactEmail}</div>
                      <div className="text-slate-500">{formatDate(ent.dateCreation)}</div>
                      <div className="text-right text-slate-700">
                        {ent.users.length} / {ent.nombreUtilisateursInclus}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Abonnés individuels</h2>
                <p className="text-sm text-slate-500">Inclut abonnés B2C et utilisateurs liés à une entreprise</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                {filteredIndividuals.length} comptes
              </span>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50">
                <div>Nom</div>
                <div>Email</div>
                <div>Type</div>
                <div className="text-right">Créé le</div>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                {filteredIndividuals.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">Aucun abonné</div>
                ) : (
                  filteredIndividuals.map((user) => (
                    <div key={user.id} className="grid grid-cols-[2fr_2fr_1fr_1fr] px-4 py-3 text-sm items-center">
                      <div className="font-medium">
                        <Link href={`/admin/users/${user.id}`} className="hover:text-emerald-600 hover:underline">
                          {user.nom || "Sans nom"}
                        </Link>
                        {user.enterpriseAccount ? (
                          <div className="text-xs text-slate-500">
                            Entreprise:{" "}
                            <Link
                              href={`/admin/enterprises/${user.enterpriseAccount.id}`}
                              className="hover:text-emerald-600 hover:underline"
                            >
                              {user.enterpriseAccount.nom}
                            </Link>
                          </div>
                        ) : null}
                      </div>
                      <div className="text-slate-600">{user.email}</div>
                      <div className="text-xs font-semibold text-slate-700">
                        {user.role === UserRole.ABONNE && "Individuel"}
                        {user.role === UserRole.COMPTE_ENTREPRISE && "Admin entreprise"}
                        {user.role === UserRole.UTILISATEUR_ENTREPRISE && "Utilisateur entreprise"}
                      </div>
                      <div className="text-right text-slate-500">{formatDate(user.dateCreation)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
