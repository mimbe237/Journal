'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { hasPermission, hasAnyPermission } from '@/lib/auth/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string | string[];
  requiredRoles?: UserRole[];
  fallback?: ReactNode;
  userRole?: UserRole;
}

/**
 * Composant pour protéger une route basée sur les permissions
 * Note: Cette vérification est côté CLIENT uniquement - TOUJOURS vérifier côté serveur!
 */
export function ProtectedRoute({
  children,
  requiredPermission,
  requiredRoles,
  fallback,
  userRole,
}: ProtectedRouteProps) {
  if (!userRole) {
    return fallback || <div>Chargement...</div>;
  }

  let isAuthorized = true;

  // Check permissions
  if (requiredPermission) {
    isAuthorized = Array.isArray(requiredPermission)
      ? hasAnyPermission(userRole, requiredPermission)
      : hasPermission(userRole, requiredPermission);
  }

  // Check roles
  if (requiredRoles && isAuthorized) {
    isAuthorized = requiredRoles.includes(userRole);
  }

  if (!isAuthorized) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Accès Refusé</h1>
            <p className="text-gray-600 mt-2">Vous n'avez pas les permissions requises</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
