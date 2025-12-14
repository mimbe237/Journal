"use client";

import { useState } from "react";
import { UserRole } from "@prisma/client";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { updateUserRoleWithAuth } from "./actions";

interface EditUserModalProps {
  user: {
    id: string;
    nom: string | null;
    email: string;
    role: UserRole;
  };
  allRoles: UserRole[];
}

export function EditUserModal({ user, allRoles }: EditUserModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [newPassword, setNewPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSubscriber = ["ABONNE", "COMPTE_ENTREPRISE", "UTILISATEUR_ENTREPRISE"].includes(user.role);

  const handleOpen = () => {
    setIsOpen(true);
    setSelectedRole(user.role);
    setNewPassword("");
    setAdminPassword("");
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("newRole", selectedRole);
    if (newPassword) {
      formData.append("newPassword", newPassword);
    }
    formData.append("adminPassword", adminPassword);

    try {
      const result = await updateUserRoleWithAuth(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        handleClose();
      }
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
      >
        Modifier
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Modifier l'utilisateur</h2>
            
            <div className="mb-6 space-y-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">Nom :</span> {user.nom || "Sans nom"}</p>
              <p><span className="font-semibold text-slate-900">Email :</span> {user.email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Rôle
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  disabled={isSubscriber}
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isSubscriber ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
                  }`}
                >
                  {allRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {isSubscriber && (
                  <p className="mt-1 text-xs text-slate-500">
                    Le rôle des abonnés ne peut pas être modifié ici.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nouveau mot de passe (optionnel)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Laisser vide pour ne pas changer"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  minLength={8}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Min. 8 caractères.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mot de passe administrateur
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Confirmez votre identité"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Requis pour confirmer la modification.
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <ButtonSecondary type="button" onClick={handleClose} disabled={loading}>
                  Annuler
                </ButtonSecondary>
                <ButtonPrimary type="submit" disabled={loading}>
                  {loading ? "Modification..." : "Confirmer"}
                </ButtonPrimary>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
