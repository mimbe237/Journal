import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { sendTemplatedEmail } from '@/modules/emails';
import crypto from 'crypto';

/**
 * POST /api/auth/forgot-password
 * Envoie un email de réinitialisation de mot de passe
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, nom: true, email: true }
    });

    // Par sécurité, on renvoie toujours un succès même si l'email n'existe pas
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si cette adresse existe, un email de réinitialisation a été envoyé.'
      });
    }

    // Supprimer les anciens tokens non utilisés pour cet utilisateur
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null
      }
    });

    // Générer un nouveau token sécurisé
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Créer le token en base
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Construire l'URL de réinitialisation
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    // Envoyer l'email via template
    try {
      await sendTemplatedEmail({
        templateSlug: 'password-reset',
        to: user.email,
        toName: user.nom,
        userId: user.id,
        values: {
          'user.prenom': user.nom?.split(' ')[0] || user.nom,
          'user.email': user.email,
          'reset.url': resetUrl,
          'reset.expiresAt': expiresAt.toLocaleString('fr-FR'),
          'app.url': appUrl
        }
      });
    } catch (emailError) {
      console.error('Erreur envoi email reset:', emailError);
      // On continue quand même - l'utilisateur peut redemander
    }

    return NextResponse.json({
      success: true,
      message: 'Si cette adresse existe, un email de réinitialisation a été envoyé.'
    });

  } catch (error) {
    console.error('Erreur forgot-password:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la demande de réinitialisation' },
      { status: 500 }
    );
  }
}
