import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { UserRole, SystemEventType } from '@prisma/client';

const ALLOWED_ROLES: UserRole[] = [UserRole.SUPER_ADMIN];

/**
 * PUT /api/admin/users/[userId]/role
 * Change le rôle d'un utilisateur
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!ALLOWED_ROLES.includes(currentUser.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { userId } = await params;
    const { role } = await request.json();

    if (!role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, nom: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Empêcher de modifier son propre rôle
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle' },
        { status: 400 }
      );
    }

    const previousRole = targetUser.role;

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        nom: true,
        role: true
      }
    });

    // Logger l'événement
    await prisma.systemEvent.create({
      data: {
        typeEvenement: SystemEventType.AUTRE,
        userId: currentUser.id,
        meta: {
          action: 'role_change',
          targetUserId: userId,
          previousRole,
          newRole: role
        }
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nom: updatedUser.nom,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Erreur role change:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de rôle' },
      { status: 500 }
    );
  }
}
