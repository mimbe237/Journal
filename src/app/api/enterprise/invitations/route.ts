import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";

// GET liste des invitations de mon entreprise
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    
    if (!user || user.role !== UserRole.COMPTE_ENTREPRISE || !user.enterpriseAccountId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const invitations = await prisma.enterpriseInvitation.findMany({
      where: { 
        enterpriseAccountId: user.enterpriseAccountId,
        acceptedAt: null,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invitations });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}

// POST créer une invitation depuis le dashboard entreprise
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    
    if (!user || user.role !== UserRole.COMPTE_ENTREPRISE || !user.enterpriseAccountId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { email } = body ?? {};

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier les licences disponibles
    const enterprise = await prisma.enterpriseAccount.findUnique({
      where: { id: user.enterpriseAccountId },
      include: {
        _count: { select: { users: true } },
        invitations: { where: { acceptedAt: null } }
      }
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    const usedLicenses = enterprise._count.users + enterprise.invitations.length;
    if (usedLicenses >= enterprise.nombreUtilisateursInclus) {
      return NextResponse.json({ 
        error: "Plus de licences disponibles. Contactez l'administrateur." 
      }, { status: 400 });
    }

    // Vérifier si déjà invité
    const existingInvitation = enterprise.invitations.find(i => i.email === email);
    if (existingInvitation) {
      return NextResponse.json({ error: "Cet email a déjà une invitation en attente" }, { status: 400 });
    }

    // Vérifier le domaine autorisé
    if (enterprise.domaineAutorise) {
      const emailDomain = '@' + email.split('@')[1];
      if (emailDomain !== enterprise.domaineAutorise) {
        return NextResponse.json({ 
          error: `L'email doit appartenir au domaine ${enterprise.domaineAutorise}` 
        }, { status: 400 });
      }
    }

    // Créer l'invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + 7);

    const invitation = await prisma.enterpriseInvitation.create({
      data: {
        enterpriseAccountId: user.enterpriseAccountId,
        email,
        role: 'UTILISATEUR_ENTREPRISE',
        token,
        expireAt,
      }
    });

    // TODO: Envoyer l'email d'invitation

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur serveur" }, { status: 500 });
  }
}
