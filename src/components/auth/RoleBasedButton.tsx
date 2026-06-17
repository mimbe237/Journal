'use client';

import { ReactNode } from 'react';
import { UserRole } from '@prisma/client';
import { hasPermission, hasAnyPermission } from '@/lib/auth/permissions';

interface RoleBasedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requiredPermission?: string | string[];
  requiredRole?: UserRole | UserRole[];
  userRole?: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Bouton qui se cache si l'utilisateur n'a pas les permissions requises
 */
export function RoleBasedButton({
  requiredPermission,
  requiredRole,
  userRole,
  children,
  fallback,
  className = '',
  ...props
}: RoleBasedButtonProps) {
  if (!userRole) {
    return null;
  }

  let isAuthorized = true;

  // Check permissions
  if (requiredPermission) {
    isAuthorized = Array.isArray(requiredPermission)
      ? hasAnyPermission(userRole, requiredPermission)
      : hasPermission(userRole, requiredPermission);
  }

  // Check roles
  if (requiredRole && isAuthorized) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    isAuthorized = roles.includes(userRole);
  }

  if (!isAuthorized) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
}
