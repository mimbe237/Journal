import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/config/prisma";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole } from "@prisma/client";
import { CreateUserButton } from "./CreateUserButton";

async function updateUserRole(formData: FormData) {
  "use server";
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    throw new Error("Non authentifié");
  }

  const userId = formData.get("userId")?.toString();
  const newRole = formData.get("newRole")?.toString() as UserRole;

  if (!userId || !newRole || !Object.values(UserRole).includes(newRole)) {
    throw new Error("Paramètres invalides");
  }

  // Logic de permission
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
  
  // Si on essaie d'assigner un rôle staff (SUPER_ADMIN, FACTURATION, SUPPORT)
  const isTargetStaffRole = [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT].includes(newRole);
  
  if (isTargetStaffRole && !isSuperAdmin) {
    throw new Error("Seul un Super Admin peut assigner des rôles staff.");
  }

  // Pour l'instant, on restreint la modification de rôle aux Super Admins pour simplifier et sécuriser.
  if (!isSuperAdmin) {
     throw new Error("Action non autorisée");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });
  
  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  const users = await prisma.user.findMany({
    orderBy: { dateCreation: "desc" },
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      dateCreation: true
    }
  });

  const allRoles = Object.values(UserRole);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Utilisateurs</h1>
            <p className="text-sm text-slate-600">Gérez les comptes et les rôles.</p>
          </div>
          <div className="flex items-center gap-3">
            {isSuperAdmin && <CreateUserButton />}
            <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {users.length} comptes
            </div>
          </div>
        </div>

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
                      <form action={updateUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select 
                          name="newRole" 
                          defaultValue={user.role}
                          className="text-xs border-slate-200 rounded shadow-sm py-1 px-2"
                        >
                          {allRoles.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <ButtonPrimary type="submit" className="px-2 py-1 text-xs">
                          OK
                        </ButtonPrimary>
                      </form>
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
