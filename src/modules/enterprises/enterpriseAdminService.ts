/**
 * Service de gestion des administrations entreprise.
 * Gère les invitations, rôles, audit et gestion des utilisateurs.
 */

import { prisma } from "@/lib/config/prisma";
import { 
  EnterpriseUserRole, 
  EnterpriseUserStatus, 
  UserRole,
  SystemEventType 
} from "@prisma/client";
import { randomBytes } from "crypto";
import { addDays } from "date-fns";
import { emailProvider } from "@/services/email";

// Types
export interface InviteUserParams {
  enterpriseAccountId: string;
  email: string;
  role: EnterpriseUserRole;
  invitedBy: string; // userId de l'admin qui invite
  ipAddress?: string;
  userAgent?: string;
}

export interface AcceptInvitationParams {
  token: string;
  nom: string;
  motDePasse: string;
}

export interface ChangeUserRoleParams {
  enterpriseAccountId: string;
  targetUserId: string;
  newRole: EnterpriseUserRole;
  reason?: string;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SuspendUserParams {
  enterpriseAccountId: string;
  targetUserId: string;
  reason: string;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface EnterpriseStats {
  totalLicenses: number;
  usedLicenses: number;
  pendingInvites: number;
  availableLicenses: number;
  activeUsers: number;
  suspendedUsers: number;
}

// Helpers
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function canManageRole(performerRole: EnterpriseUserRole, targetRole: EnterpriseUserRole): boolean {
  const hierarchy: Record<EnterpriseUserRole, number> = {
    ADMIN_PRIMAIRE: 100,
    ADMIN_SECONDAIRE: 80,
    MANAGER: 60,
    UTILISATEUR: 40,
    SUSPENDU: 0
  };
  return hierarchy[performerRole] > hierarchy[targetRole];
}

// Service Functions

/**
 * Vérifie si un utilisateur peut effectuer des actions admin sur l'entreprise.
 */
export async function canAdminEnterprise(
  userId: string, 
  enterpriseAccountId: string
): Promise<{ allowed: boolean; role?: EnterpriseUserRole }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      enterpriseAccountId: true, 
      enterpriseRole: true 
    }
  });

  if (!user || user.enterpriseAccountId !== enterpriseAccountId) {
    return { allowed: false };
  }

  const adminRoles: EnterpriseUserRole[] = [
    EnterpriseUserRole.ADMIN_PRIMAIRE,
    EnterpriseUserRole.ADMIN_SECONDAIRE,
    EnterpriseUserRole.MANAGER
  ];

  if (user.enterpriseRole && adminRoles.includes(user.enterpriseRole)) {
    return { allowed: true, role: user.enterpriseRole };
  }

  return { allowed: false };
}

/**
 * Récupère les statistiques d'une entreprise.
 */
export async function getEnterpriseStats(enterpriseAccountId: string): Promise<EnterpriseStats> {
  const [enterprise, userCounts, pendingInvites] = await Promise.all([
    prisma.enterpriseAccount.findUnique({
      where: { id: enterpriseAccountId },
      select: { nombreUtilisateursInclus: true }
    }),
    prisma.user.groupBy({
      by: ["enterpriseStatus"],
      where: { enterpriseAccountId },
      _count: true
    }),
    prisma.enterpriseInvitation.count({
      where: { 
        enterpriseAccountId,
        acceptedAt: null,
        expireAt: { gt: new Date() }
      }
    })
  ]);

  const totalLicenses = enterprise?.nombreUtilisateursInclus ?? 0;
  
  const activeUsers = userCounts.find(c => c.enterpriseStatus === EnterpriseUserStatus.ACTIF)?._count ?? 0;
  const suspendedUsers = userCounts.find(c => c.enterpriseStatus === EnterpriseUserStatus.SUSPENDU)?._count ?? 0;
  const usedLicenses = activeUsers;

  return {
    totalLicenses,
    usedLicenses,
    pendingInvites,
    availableLicenses: Math.max(0, totalLicenses - usedLicenses - pendingInvites),
    activeUsers,
    suspendedUsers
  };
}

/**
 * Invite un utilisateur à rejoindre l'entreprise.
 */
export async function inviteEnterpriseUser(params: InviteUserParams): Promise<{ success: boolean; error?: string; invitationId?: string }> {
  const { enterpriseAccountId, email, role, invitedBy, ipAddress, userAgent } = params;

  // Vérifier les permissions
  const { allowed, role: performerRole } = await canAdminEnterprise(invitedBy, enterpriseAccountId);
  if (!allowed || !performerRole) {
    return { success: false, error: "Vous n'avez pas les droits pour inviter des utilisateurs" };
  }

  // Seul ADMIN_PRIMAIRE peut inviter des admins
  if (role === EnterpriseUserRole.ADMIN_PRIMAIRE) {
    return { success: false, error: "Il ne peut y avoir qu'un seul admin primaire" };
  }
  
  if (role === EnterpriseUserRole.ADMIN_SECONDAIRE && performerRole !== EnterpriseUserRole.ADMIN_PRIMAIRE) {
    return { success: false, error: "Seul l'admin primaire peut créer des admins secondaires" };
  }

  // Vérifier les licences disponibles
  const stats = await getEnterpriseStats(enterpriseAccountId);
  if (stats.availableLicenses <= 0) {
    return { success: false, error: "Plus de licences disponibles" };
  }

  // Vérifier si l'email n'est pas déjà utilisé
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, enterpriseAccountId: true }
  });

  if (existingUser?.enterpriseAccountId === enterpriseAccountId) {
    return { success: false, error: "Cet utilisateur fait déjà partie de l'entreprise" };
  }

  // Vérifier invitation existante non expirée
  const existingInvite = await prisma.enterpriseInvitation.findFirst({
    where: {
      enterpriseAccountId,
      email: email.toLowerCase(),
      acceptedAt: null,
      expireAt: { gt: new Date() }
    }
  });

  if (existingInvite) {
    return { success: false, error: "Une invitation est déjà en attente pour cet email" };
  }

  // Créer l'invitation
  const token = generateToken();
  const expireAt = addDays(new Date(), 7); // 7 jours de validité

  const invitation = await prisma.enterpriseInvitation.create({
    data: {
      enterpriseAccountId,
      email: email.toLowerCase(),
      role,
      token,
      expireAt,
      createdBy: invitedBy
    }
  });

  // Mettre à jour le compteur
  await prisma.enterpriseAccount.update({
    where: { id: enterpriseAccountId },
    data: { nombreUtilisateursInvites: { increment: 1 } }
  });

  // Logger l'action
  await logEnterpriseAction({
    enterpriseAccountId,
    action: "INVITE_SENT",
    targetUserId: null,
    changedFields: { email, role },
    performedBy: invitedBy,
    ipAddress,
    userAgent
  });

  // Envoyer l'email d'invitation
  const enterprise = await prisma.enterpriseAccount.findUnique({
    where: { id: enterpriseAccountId },
    select: { nom: true }
  });

  try {
    await emailProvider.send({
      to: email,
      subject: `Invitation à rejoindre ${enterprise?.nom ?? "l'entreprise"} sur Journal Digital`,
      html: `
        <h1>Vous êtes invité !</h1>
        <p>${enterprise?.nom ?? "Une entreprise"} vous invite à rejoindre leur espace de lecture sur Journal Digital.</p>
        <p>Cliquez sur le lien ci-dessous pour accepter l'invitation (valide 7 jours) :</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/invitation/accept?token=${token}">
          Accepter l'invitation
        </a>
        <p>Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.</p>
      `
    });
  } catch (e) {
    console.error("Erreur envoi email invitation:", e);
  }

  return { success: true, invitationId: invitation.id };
}

/**
 * Accepte une invitation et crée le compte utilisateur.
 */
export async function acceptEnterpriseInvitation(params: AcceptInvitationParams): Promise<{ success: boolean; error?: string; userId?: string }> {
  const { token, nom, motDePasse } = params;

  const invitation = await prisma.enterpriseInvitation.findUnique({
    where: { token },
    include: { enterpriseAccount: { select: { id: true, nom: true } } }
  });

  if (!invitation) {
    return { success: false, error: "Invitation introuvable" };
  }

  if (invitation.acceptedAt) {
    return { success: false, error: "Cette invitation a déjà été utilisée" };
  }

  if (invitation.expireAt < new Date()) {
    return { success: false, error: "Cette invitation a expiré" };
  }

  // Vérifier si l'email n'existe pas déjà
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email }
  });

  if (existingUser) {
    // Si l'utilisateur existe déjà, on le rattache à l'entreprise
    if (existingUser.enterpriseAccountId) {
      return { success: false, error: "Cet utilisateur appartient déjà à une entreprise" };
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        enterpriseAccountId: invitation.enterpriseAccountId,
        enterpriseRole: invitation.role,
        enterpriseStatus: EnterpriseUserStatus.ACTIF,
        dateAssignmentEnterprise: new Date(),
        role: UserRole.UTILISATEUR_ENTREPRISE
      }
    });

    // Mettre à jour l'invitation
    await prisma.enterpriseInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date(), acceptedByUserId: existingUser.id }
    });

    // Mettre à jour les compteurs
    await prisma.enterpriseAccount.update({
      where: { id: invitation.enterpriseAccountId },
      data: {
        nombreUtilisateursInvites: { decrement: 1 },
        nombreUtilisateursActifs: { increment: 1 }
      }
    });

    await logEnterpriseAction({
      enterpriseAccountId: invitation.enterpriseAccountId,
      action: "USER_JOINED",
      targetUserId: existingUser.id,
      changedFields: { role: invitation.role },
      performedBy: existingUser.id
    });

    return { success: true, userId: existingUser.id };
  }

  // Créer un nouvel utilisateur
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(motDePasse, 10);

  const newUser = await prisma.user.create({
    data: {
      nom,
      email: invitation.email,
      motDePasseHash: hashedPassword,
      role: UserRole.UTILISATEUR_ENTREPRISE,
      enterpriseAccountId: invitation.enterpriseAccountId,
      enterpriseRole: invitation.role,
      enterpriseStatus: EnterpriseUserStatus.ACTIF,
      dateAssignmentEnterprise: new Date()
    }
  });

  // Mettre à jour l'invitation
  await prisma.enterpriseInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date(), acceptedByUserId: newUser.id }
  });

  // Mettre à jour les compteurs
  await prisma.enterpriseAccount.update({
    where: { id: invitation.enterpriseAccountId },
    data: {
      nombreUtilisateursInvites: { decrement: 1 },
      nombreUtilisateursActifs: { increment: 1 }
    }
  });

  await logEnterpriseAction({
    enterpriseAccountId: invitation.enterpriseAccountId,
    action: "USER_CREATED",
    targetUserId: newUser.id,
    changedFields: { role: invitation.role },
    performedBy: newUser.id
  });

  return { success: true, userId: newUser.id };
}

/**
 * Change le rôle d'un utilisateur au sein de l'entreprise.
 */
export async function changeEnterpriseUserRole(params: ChangeUserRoleParams): Promise<{ success: boolean; error?: string }> {
  const { enterpriseAccountId, targetUserId, newRole, reason, performedBy, ipAddress, userAgent } = params;

  // Vérifier les permissions
  const { allowed, role: performerRole } = await canAdminEnterprise(performedBy, enterpriseAccountId);
  if (!allowed || !performerRole) {
    return { success: false, error: "Vous n'avez pas les droits pour modifier les rôles" };
  }

  // Récupérer l'utilisateur cible
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, enterpriseAccountId: true, enterpriseRole: true }
  });

  if (!targetUser || targetUser.enterpriseAccountId !== enterpriseAccountId) {
    return { success: false, error: "Utilisateur non trouvé dans cette entreprise" };
  }

  // Vérifier la hiérarchie
  if (targetUser.enterpriseRole && !canManageRole(performerRole, targetUser.enterpriseRole)) {
    return { success: false, error: "Vous ne pouvez pas modifier cet utilisateur" };
  }

  // ADMIN_PRIMAIRE ne peut pas être changé
  if (targetUser.enterpriseRole === EnterpriseUserRole.ADMIN_PRIMAIRE) {
    return { success: false, error: "L'admin primaire ne peut pas être modifié" };
  }

  // Seul ADMIN_PRIMAIRE peut promouvoir en ADMIN_SECONDAIRE
  if (newRole === EnterpriseUserRole.ADMIN_SECONDAIRE && performerRole !== EnterpriseUserRole.ADMIN_PRIMAIRE) {
    return { success: false, error: "Seul l'admin primaire peut créer des admins secondaires" };
  }

  const oldRole = targetUser.enterpriseRole;

  await prisma.user.update({
    where: { id: targetUserId },
    data: { enterpriseRole: newRole }
  });

  await logEnterpriseAction({
    enterpriseAccountId,
    action: "ROLE_CHANGED",
    targetUserId,
    changedFields: { oldRole, newRole },
    reason,
    performedBy,
    ipAddress,
    userAgent
  });

  return { success: true };
}

/**
 * Suspend un utilisateur de l'entreprise.
 */
export async function suspendEnterpriseUser(params: SuspendUserParams): Promise<{ success: boolean; error?: string }> {
  const { enterpriseAccountId, targetUserId, reason, performedBy, ipAddress, userAgent } = params;

  const { allowed, role: performerRole } = await canAdminEnterprise(performedBy, enterpriseAccountId);
  if (!allowed || !performerRole) {
    return { success: false, error: "Vous n'avez pas les droits" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, enterpriseAccountId: true, enterpriseRole: true, enterpriseStatus: true }
  });

  if (!targetUser || targetUser.enterpriseAccountId !== enterpriseAccountId) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  if (targetUser.enterpriseRole === EnterpriseUserRole.ADMIN_PRIMAIRE) {
    return { success: false, error: "L'admin primaire ne peut pas être suspendu" };
  }

  if (targetUser.enterpriseRole && !canManageRole(performerRole, targetUser.enterpriseRole)) {
    return { success: false, error: "Vous ne pouvez pas suspendre cet utilisateur" };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      enterpriseStatus: EnterpriseUserStatus.SUSPENDU,
      enterpriseRole: EnterpriseUserRole.SUSPENDU,
      suspendedReason: reason,
      suspendedAt: new Date()
    }
  });

  await prisma.enterpriseAccount.update({
    where: { id: enterpriseAccountId },
    data: { nombreUtilisateursActifs: { decrement: 1 } }
  });

  await logEnterpriseAction({
    enterpriseAccountId,
    action: "USER_SUSPENDED",
    targetUserId,
    reason,
    performedBy,
    ipAddress,
    userAgent
  });

  return { success: true };
}

/**
 * Réactive un utilisateur suspendu.
 */
export async function reactivateEnterpriseUser(
  enterpriseAccountId: string,
  targetUserId: string,
  newRole: EnterpriseUserRole,
  performedBy: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const { allowed } = await canAdminEnterprise(performedBy, enterpriseAccountId);
  if (!allowed) {
    return { success: false, error: "Vous n'avez pas les droits" };
  }

  // Vérifier les licences
  const stats = await getEnterpriseStats(enterpriseAccountId);
  if (stats.availableLicenses <= 0) {
    return { success: false, error: "Plus de licences disponibles" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { enterpriseAccountId: true, enterpriseStatus: true }
  });

  if (!targetUser || targetUser.enterpriseAccountId !== enterpriseAccountId) {
    return { success: false, error: "Utilisateur non trouvé" };
  }

  if (targetUser.enterpriseStatus !== EnterpriseUserStatus.SUSPENDU) {
    return { success: false, error: "Cet utilisateur n'est pas suspendu" };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      enterpriseStatus: EnterpriseUserStatus.ACTIF,
      enterpriseRole: newRole,
      suspendedReason: null,
      suspendedAt: null
    }
  });

  await prisma.enterpriseAccount.update({
    where: { id: enterpriseAccountId },
    data: { nombreUtilisateursActifs: { increment: 1 } }
  });

  await logEnterpriseAction({
    enterpriseAccountId,
    action: "USER_REACTIVATED",
    targetUserId,
    changedFields: { newRole },
    performedBy,
    ipAddress,
    userAgent
  });

  return { success: true };
}

/**
 * Récupère les logs d'audit d'une entreprise.
 */
export async function getEnterpriseAuditLogs(
  enterpriseAccountId: string,
  options?: { limit?: number; offset?: number }
) {
  const { limit = 50, offset = 0 } = options ?? {};

  return prisma.enterpriseAuditLog.findMany({
    where: { enterpriseAccountId },
    orderBy: { performedAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      performer: { select: { id: true, nom: true, email: true } },
      targetUser: { select: { id: true, nom: true, email: true } }
    }
  });
}

/**
 * Log une action d'audit entreprise.
 */
async function logEnterpriseAction(params: {
  enterpriseAccountId: string;
  action: string;
  targetUserId?: string | null;
  changedFields?: Record<string, any>;
  reason?: string;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.enterpriseAuditLog.create({
    data: {
      enterpriseAccountId: params.enterpriseAccountId,
      action: params.action,
      targetUserId: params.targetUserId,
      changedFields: params.changedFields,
      reason: params.reason,
      performedBy: params.performedBy,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    }
  });
}

/**
 * Crée un admin primaire lors de la création d'un compte entreprise.
 */
export async function setupEnterpriseAdmin(
  enterpriseAccountId: string,
  adminEmail: string,
  createdBy: string
): Promise<{ success: boolean; error?: string; invitationId?: string }> {
  // Vérifier que l'entreprise n'a pas déjà un admin primaire
  const enterprise = await prisma.enterpriseAccount.findUnique({
    where: { id: enterpriseAccountId },
    select: { adminPrimaireId: true, adminPrimaireEmail: true }
  });

  if (!enterprise) {
    return { success: false, error: "Entreprise non trouvée" };
  }

  if (enterprise.adminPrimaireId) {
    return { success: false, error: "Cette entreprise a déjà un admin primaire" };
  }

  // Mettre à jour l'email admin primaire
  await prisma.enterpriseAccount.update({
    where: { id: enterpriseAccountId },
    data: { adminPrimaireEmail: adminEmail.toLowerCase() }
  });

  // Créer l'invitation pour l'admin primaire
  const token = generateToken();
  const expireAt = addDays(new Date(), 14); // 14 jours pour l'admin primaire

  const invitation = await prisma.enterpriseInvitation.create({
    data: {
      enterpriseAccountId,
      email: adminEmail.toLowerCase(),
      role: EnterpriseUserRole.ADMIN_PRIMAIRE,
      token,
      expireAt,
      createdBy
    }
  });

  // Envoyer l'email d'invitation spécial admin
  const enterpriseData = await prisma.enterpriseAccount.findUnique({
    where: { id: enterpriseAccountId },
    select: { nom: true }
  });

  try {
    await emailProvider.send({
      to: adminEmail,
      subject: `Bienvenue ! Activez votre compte administrateur ${enterpriseData?.nom ?? ""}`,
      html: `
        <h1>Bienvenue en tant qu'administrateur !</h1>
        <p>Vous êtes désigné comme administrateur principal du compte entreprise 
        <strong>${enterpriseData?.nom ?? "votre entreprise"}</strong> sur Journal Digital.</p>
        
        <p>En tant qu'admin primaire, vous pourrez :</p>
        <ul>
          <li>Inviter et gérer les utilisateurs de votre entreprise</li>
          <li>Gérer les rôles et permissions</li>
          <li>Consulter les rapports d'activité</li>
          <li>Gérer les abonnements et la facturation</li>
        </ul>
        
        <p>Cliquez sur le lien ci-dessous pour activer votre compte (valide 14 jours) :</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/invitation/accept?token=${token}">
          Activer mon compte administrateur
        </a>
      `
    });
  } catch (e) {
    console.error("Erreur envoi email admin primaire:", e);
  }

  await logEnterpriseAction({
    enterpriseAccountId,
    action: "ADMIN_PRIMAIRE_INVITED",
    changedFields: { email: adminEmail },
    performedBy: createdBy
  });

  return { success: true, invitationId: invitation.id };
}
