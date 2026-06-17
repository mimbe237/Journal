'use client';

import { ReactNode } from 'react';
import { UserRole } from '@prisma/client';
import { hasPermission, hasAnyPermission } from '@/lib/auth/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string | string[];
  requiredRoles?: UserRole[];
  userRole?: UserRole;
  fallback?: ReactNode;
}

/**
 * Wrapper pour masquer des blocs UI si l'utilisateur n'a pas la permission
 */
export function PermissionGuard({
  children,
  requiredPermission,
  requiredRoles,
  userRole,
  fallback,
}: PermissionGuardProps) {
  if (!userRole) return fallback || null;

  let isAuthorized = true;

  if (requiredPermission) {
    isAuthorized = Array.isArray(requiredPermission)
      ? hasAnyPermission(userRole, requiredPermission)
      : hasPermission(userRole, requiredPermission);
  }

  if (requiredRoles && isAuthorized) {
    isAuthorized = requiredRoles.includes(userRole);
  }

  if (!isAuthorized) return fallback || null;

  return <>{children}</>;
}
