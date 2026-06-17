'use client';

import { useState } from 'react';

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentRole: string;
  onConfirm: (newRole: string) => Promise<void>;
}

const ROLES = [
  { value: 'ABONNE', label: 'Abonné', description: 'Accès lecture aux éditions' },
  { value: 'COMPTE_ENTREPRISE', label: 'Compte Entreprise', description: 'Administrateur d\'entreprise' },
  { value: 'SUPPORT', label: 'Support', description: 'Accès support client' },
  { value: 'FACTURATION', label: 'Facturation', description: 'Accès facturation et paiements' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Accès total à la plateforme' },
];

export function RoleChangeModal({
  isOpen,
  onClose,
  userId,
  userName,
  currentRole,
  onConfirm,
}: RoleChangeModalProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (selectedRole === currentRole) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(selectedRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-700';
      case 'FACTURATION':
        return 'bg-amber-100 text-amber-700';
      case 'SUPPORT':
        return 'bg-blue-100 text-blue-700';
      case 'COMPTE_ENTREPRISE':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-emerald-100 text-emerald-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Modifier le rôle
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Utilisateur</p>
            <p className="font-medium text-slate-900">{userName}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-slate-500">Rôle actuel:</span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(currentRole)}`}>
                {ROLES.find(r => r.value === currentRole)?.label || currentRole}
              </span>
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Nouveau rôle</p>
            {ROLES.map((role) => (
              <label
                key={role.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  selectedRole === role.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{role.label}</span>
                    {role.value === currentRole && (
                      <span className="text-xs text-slate-500">(actuel)</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{role.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Warning for admin roles */}
          {(selectedRole === 'SUPER_ADMIN' || selectedRole === 'FACTURATION' || selectedRole === 'SUPPORT') && 
           selectedRole !== currentRole && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex gap-2">
                <svg className="h-5 w-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-amber-700">
                  Ce rôle donne accès à l'administration. Assurez-vous que cet utilisateur doit avoir ces privilèges.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || selectedRole === currentRole}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleChangeModal;
