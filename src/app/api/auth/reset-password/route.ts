import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import bcrypt from 'bcrypt';

/**
 * POST /api/auth/reset-password
 * Réinitialise le mot de passe avec un token valide
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // Validation des entrées
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      );
    }

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Les mots de passe ne correspondent pas' },
        { status: 400 }
      );
    }

    // Validation de la complexité du mot de passe
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasNumber) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins une majuscule et un chiffre' },
        { status: 400 }
      );
    }

    // Rechercher le token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } }
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Lien de réinitialisation invalide ou expiré' },
        { status: 400 }
      );
    }

    // Vérifier si le token n'est pas expiré
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau.' },
        { status: 400 }
      );
    }

    // Vérifier si le token n'a pas déjà été utilisé
    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'Ce lien a déjà été utilisé. Veuillez en demander un nouveau.' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const motDePasseHash = await bcrypt.hash(password, 12);

    // Mettre à jour le mot de passe et marquer le token comme utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { motDePasseHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur reset-password:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Vérifie si un token est valide
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token manquant' },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { expiresAt: true, usedAt: true }
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: 'Token invalide' });
    }

    if (resetToken.usedAt) {
      return NextResponse.json({ valid: false, error: 'Token déjà utilisé' });
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: 'Token expiré' });
    }

    return NextResponse.json({ valid: true });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    return NextResponse.json(
      { valid: false, error: 'Erreur de vérification' },
      { status: 500 }
    );
  }
}
