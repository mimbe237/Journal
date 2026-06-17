import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { hasPermission, hasAnyPermission, isSuperAdmin } from '@/lib/auth/permissions';

/**
 * Middleware to check user permissions before allowing route access
 * Usage: await checkPermission(req, 'permission:name')
 */
export async function checkPermission(
  req: NextRequest,
  requiredPermission: string | string[]
) {
  try {
    const user = await getCurrentUserFromRequest(req);

    if (!user) {
      return {
        authorized: false,
        error: 'Non authentifié',
        status: 401,
      };
    }

    // Check permission
    const isAuthorized = Array.isArray(requiredPermission)
      ? hasAnyPermission(user.role, requiredPermission)
      : hasPermission(user.role, requiredPermission);

    if (!isAuthorized) {
      return {
        authorized: false,
        error: 'Accès refusé',
        status: 403,
      };
    }

    return {
      authorized: true,
      user,
      status: 200,
    };
  } catch (error: any) {
    return {
      authorized: false,
      error: error.message || 'Erreur serveur',
      status: 500,
    };
  }
}

/**
 * Require specific roles (more restrictive than permission-based)
 * Usage: await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN])
 */
export async function requireUserWithRoles(
  req: NextRequest,
  userId?: string, // Optional: check if user owns the resource
  allowedRoles?: UserRole[]
) {
  try {
    const user = await getCurrentUserFromRequest(req);

    if (!user) {
      throw new Error('Non authentifié');
    }

    // If userId provided, check ownership
    if (userId && user.id !== userId && !isSuperAdmin(user.role)) {
      throw new Error('Accès refusé: vous ne pouvez pas accéder aux ressources d\'un autre utilisateur');
    }

    // Check if user's role is allowed
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      throw new Error('Accès refusé: votre rôle n\'a pas les permissions requises');
    }

    return user;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Utility to return error response for permission denied
 */
export function permissionDenied(message: string = 'Accès refusé') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Utility to return error response for unauthorized
 */
export function unauthorized(message: string = 'Non authentifié') {
  return NextResponse.json({ error: message }, { status: 401 });
}
