import { UserRole } from "@prisma/client";

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Permission = string;

export type RolePermissions = Record<UserRole, Set<Permission>>;

// ============================================
// DÉFINITION DES PERMISSIONS PAR RÔLE
// ============================================

const PERMISSIONS: RolePermissions = {
  // -------- ABONNE --------
  ABONNE: new Set([
    // Lecture seule
    "read:editions",
    "read:own_subscriptions",
    "read:own_profile",
    "read:own_reading_sessions",
    // Gestion personnelle
    "manage:own_subscriptions",
    "update:own_profile",
    "download:receipts",
  ]),

  // -------- UTILISATEUR_ENTREPRISE --------
  UTILISATEUR_ENTREPRISE: new Set([
    // Héritage: tout ce que ABONNE peut faire
    "read:editions",
    "read:own_subscriptions",
    "read:own_profile",
    "read:own_reading_sessions",
    "manage:own_subscriptions",
    "update:own_profile",
    "download:receipts",
    // Permissions supplémentaires
    "read:enterprise_dashboard",
    "read:enterprise_stats",
    "read:enterprise_members",
  ]),

  // -------- COMPTE_ENTREPRISE --------
  COMPTE_ENTREPRISE: new Set([
    // Héritage: tout comme UTILISATEUR_ENTREPRISE
    "read:editions",
    "read:own_subscriptions",
    "read:own_profile",
    "read:own_reading_sessions",
    "manage:own_subscriptions",
    "update:own_profile",
    "download:receipts",
    "read:enterprise_dashboard",
    "read:enterprise_stats",
    "read:enterprise_members",
    // Permissions d'administration d'entreprise
    "manage:enterprise_users",
    "invite:enterprise_users",
    "remove:enterprise_users",
    "update:enterprise_profile",
    "read:enterprise_billing",
    "download:enterprise_reports",
    "create:enterprise_invitations",
    "manage:enterprise_settings",
    "read:enterprise_audit",
  ]),

  // -------- FACTURATION --------
  FACTURATION: new Set([
    // Dashboards
    "access:admin_panel",
    "read:billing_dashboard",
    "read:financial_reports",
    "read:subscription_analytics",
    // Gestion des soumissions manuelles
    "read:manual_submissions",
    "approve:manual_submissions",
    "reject:manual_submissions",
    "read:justificatifs",
    "download:justificatifs",
    // Gestion des abonnés
    "create:manual_subscribers",
    "read:subscribers",
    // Rapports et exports
    "generate:financial_reports",
    "export:financial_data",
    "export:subscription_data",
    // Codes promo (lecture seule)
    "read:promo_codes",
    "read:promo_code_stats",
    // Tarifs (lecture seule)
    "read:pricing",
  ]),

  // -------- SUPPORT --------
  SUPPORT: new Set([
    // Dashboards
    "access:admin_panel",
    "read:support_dashboard",
    // Gestion des soumissions
    "read:manual_submissions",
    "approve:manual_submissions",
    "reject:manual_submissions",
    "read:justificatifs",
    // Gestion d'éditions
    "create:editions",
    "update:editions",
    "delete:editions",
    "upload:edition_covers",
    "update:edition_metadata",
    // Gestion des utilisateurs
    "read:users",
    "create:users",
    "update:users",
    "reset:user_passwords",
    "read:user_history",
    // Gestion des entreprises
    "read:enterprises",
    "read:enterprise_details",
    "read:enterprise_users",
    "read:enterprise_subscriptions",
    "verify:enterprise_invitations",
    // Codes promo
    "read:promo_codes",
    "create:promo_codes",
    "update:promo_codes",
    "read:promo_code_stats",
    // Rapports
    "generate:support_reports",
    "export:support_data",
  ]),

  // -------- SUPER_ADMIN --------
  SUPER_ADMIN: new Set([
    // TOUT - Super admin a accès à tout
    // Utilisateurs
    "access:admin_panel",
    "read:all_users",
    "create:users",
    "update:users",
    "delete:users",
    "manage:user_roles",
    // Éditions
    "create:editions",
    "update:editions",
    "delete:editions",
    "publish:editions",
    "unpublish:editions",
    "upload:edition_covers",
    "update:edition_metadata",
    // Abonnements
    "read:all_subscriptions",
    "create:subscriptions",
    "update:subscriptions",
    "cancel:subscriptions",
    "refund:subscriptions",
    // Soumissions manuelles
    "read:manual_submissions",
    "approve:manual_submissions",
    "reject:manual_submissions",
    "delete:manual_submissions",
    "read:justificatifs",
    "download:justificatifs",
    "manage:justificatifs",
    // Entreprises
    "read:all_enterprises",
    "create:enterprises",
    "update:enterprises",
    "delete:enterprises",
    "manage:enterprise_users",
    "manage:enterprise_settings",
    // Codes promo
    "read:promo_codes",
    "create:promo_codes",
    "update:promo_codes",
    "delete:promo_codes",
    "validate:promo_codes",
    // Tarifs
    "read:pricing",
    "update:pricing",
    "validate:price_changes",
    // Dashboards
    "read:global_dashboard",
    "read:billing_dashboard",
    "read:financial_reports",
    "read:support_dashboard",
    "generate:all_reports",
    "export:all_data",
    // Audit et sécurité
    "read:audit_logs",
    "read:system_events",
    "manage:system_settings",
    "manage:security",
    "manage:backups",
  ]),
};

// ============================================
// UTILITIES
// ============================================

/**
 * Check if a user role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms.has(permission);
}

/**
 * Check if a user role has ANY of the given permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if a user role has ALL of the given permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return Array.from(PERMISSIONS[role] || []);
}

/**
 * Check if role can access admin panel
 */
export function canAccessAdmin(role: UserRole): boolean {
  return hasPermission(role, "access:admin_panel");
}

/**
 * Check if role can manage billing
 */
export function canManageBilling(role: UserRole): boolean {
  return hasPermission(role, "read:billing_dashboard");
}

/**
 * Check if role can manage support
 */
export function canManageSupport(role: UserRole): boolean {
  return hasPermission(role, "read:support_dashboard");
}

/**
 * Check if role is enterprise admin
 */
export function isEnterpriseAdmin(role: UserRole): boolean {
  return role === UserRole.COMPTE_ENTREPRISE;
}

/**
 * Check if role is staff (can access admin panel)
 */
export function isStaff(role: UserRole): boolean {
  return [UserRole.FACTURATION, UserRole.SUPPORT, UserRole.SUPER_ADMIN].includes(role);
}

/**
 * Check if role is super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

// ============================================
// ROLE HIERARCHY
// ============================================

/**
 * Get all roles that a given role can manage/view
 * (for hierarchical access control)
 */
export function getManageableRoles(role: UserRole): UserRole[] {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      // Super admin peut gérer tous les rôles
      return [
        UserRole.ABONNE,
        UserRole.UTILISATEUR_ENTREPRISE,
        UserRole.COMPTE_ENTREPRISE,
        UserRole.FACTURATION,
        UserRole.SUPPORT,
      ];

    case UserRole.SUPPORT:
      // Support peut gérer les utilisateurs individuels et entreprises
      return [UserRole.ABONNE, UserRole.UTILISATEUR_ENTREPRISE, UserRole.COMPTE_ENTREPRISE];

    case UserRole.COMPTE_ENTREPRISE:
      // Admin entreprise ne peut gérer que ses propres utilisateurs
      return [UserRole.UTILISATEUR_ENTREPRISE];

    default:
      return [];
  }
}

/**
 * Check if one role can manage another role
 */
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return getManageableRoles(managerRole).includes(targetRole);
}

// ============================================
// ROUTE PROTECTION
// ============================================

/**
 * Check if a role can access a specific admin route
 */
export const ADMIN_ROUTES: Record<string, UserRole[]> = {
  "/admin/facturation": [UserRole.FACTURATION, UserRole.SUPER_ADMIN],
  "/admin/facturation/dashboard": [UserRole.FACTURATION, UserRole.SUPER_ADMIN],
  "/admin/facturation/soumissions": [UserRole.FACTURATION, UserRole.SUPER_ADMIN],
  "/admin/facturation/rapports": [UserRole.FACTURATION, UserRole.SUPER_ADMIN],
  "/admin/facturation/prix": [UserRole.FACTURATION, UserRole.SUPER_ADMIN],

  "/admin/support": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/support/dashboard": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/support/editions": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/support/utilisateurs": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/support/entreprises": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/support/codes-promo": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],

  "/admin/users": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/editions": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/enterprises": [UserRole.SUPPORT, UserRole.SUPER_ADMIN, UserRole.FACTURATION],
  "/admin/subscriptions": [UserRole.SUPPORT, UserRole.SUPER_ADMIN, UserRole.FACTURATION],
  "/admin/promocodes": [UserRole.SUPPORT, UserRole.SUPER_ADMIN],
  "/admin/exports": [UserRole.SUPPORT, UserRole.SUPER_ADMIN, UserRole.FACTURATION],

  "/admin/super": [UserRole.SUPER_ADMIN],
  "/admin/super/utilisateurs": [UserRole.SUPER_ADMIN],
  "/admin/super/entreprises": [UserRole.SUPER_ADMIN],
  "/admin/super/settings": [UserRole.SUPER_ADMIN],
  "/admin/super/audit-logs": [UserRole.SUPER_ADMIN],

  "/admin": [
    UserRole.FACTURATION,
    UserRole.SUPPORT,
    UserRole.SUPER_ADMIN,
    UserRole.COMPTE_ENTREPRISE,
  ],

  "/enterprise/dashboard": [
    UserRole.UTILISATEUR_ENTREPRISE,
    UserRole.COMPTE_ENTREPRISE,
  ],
};

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  // Check exact match
  if (ADMIN_ROUTES[route]) {
    return ADMIN_ROUTES[route].includes(role);
  }

  // Check prefix match (for nested routes)
  for (const [routePath, allowedRoles] of Object.entries(ADMIN_ROUTES)) {
    if (route.startsWith(routePath)) {
      return allowedRoles.includes(role);
    }
  }

  return false;
}
