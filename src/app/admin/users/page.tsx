import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole } from "@prisma/client";
import { CreateUserButton } from "./CreateUserButton";
import { EditUserModal } from "./EditUserModal";

const staffRoles: UserRole[] = [
  UserRole.SUPER_ADMIN, 
  UserRole.SUPPORT, 
  UserRole.FACTURATION, 
  UserRole.COMMERCIAL
].filter(Boolean);
type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  const roleFilter = (() => {
    const raw = params["role"];
    return Array.isArray(raw) ? raw[0] : raw ?? "";
  })();
  const q = (() => {
    const raw = params["q"];
    return (Array.isArray(raw) ? raw[0] : raw ?? "").toLowerCase().trim();
  })();

  let users = [];
  try {
    users = await prisma.user.findMany({
      where: {
        role: { in: roleFilter && staffRoles.includes(roleFilter as UserRole) ? [roleFilter as UserRole] : staffRoles },
        AND: q
          ? [
              {
                OR: [
                  { nom: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } }
                ]
              }
            ]
          : undefined
      },
      orderBy: { dateCreation: "desc" },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        dateCreation: true
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return (
      <div className="p-8 text-red-600">
        <p className="font-bold">Erreur lors du chargement des utilisateurs.</p>
        <pre className="mt-4 overflow-auto rounded bg-red-50 p-4 text-xs text-red-800">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }

  const allRoles = staffRoles;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Utilisateurs (Staff)</h1>
            <p className="text-sm text-slate-600">Admins, support et facturation uniquement.</p>
          </div>
          <div className="flex items-center gap-3">
            {isSuperAdmin && <CreateUserButton />}
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {users.length} comptes
            </div>
          </div>
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
              Rôle
              <select
                name="role"
                defaultValue={roleFilter || ""}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Tous</option>
                {staffRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
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

        <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Nom</div>
            <div>Email</div>
            <div>Rôle</div>
            <div>Créé le</div>
            <div>Action</div>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((user) => {
              return (
                <div
                  key={user.id}
                  className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] items-center gap-3 px-4 py-3 text-sm text-slate-800"
                >
                  <div className="font-medium">
                    <Link href={`/admin/users/${user.id}`} className="hover:text-emerald-600 hover:underline">
                      {user.nom || "Sans nom"}
                    </Link>
                  </div>
                  <div className="text-slate-600">{user.email}</div>
                  <div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'FACTURATION' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'SUPPORT' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {new Date(user.dateCreation).toLocaleDateString("fr-FR")}
                  </div>
                  <div>
                    {isSuperAdmin ? (
                      <EditUserModal user={user} allRoles={allRoles} />
                    ) : (
                      <span className="text-xs text-slate-400">Lecture seule</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
