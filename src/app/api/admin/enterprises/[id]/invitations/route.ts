import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import { prisma } from "@/lib/config/prisma";

// GET liste des invitations d'une entreprise
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.SUPPORT]);

    const invitations = await prisma.enterpriseInvitation.findMany({
      where: { enterpriseAccountId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invitations });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur de récupération" }, { status: 400 });
  }
}

// POST créer une nouvelle invitation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT]);
    const body = await req.json();
    const { email, role = 'UTILISATEUR_ENTREPRISE' } = body ?? {};

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier que l'entreprise existe et a des licences disponibles
    const enterprise = await prisma.enterpriseAccount.findUnique({
      where: { id },
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
        error: "Plus de licences disponibles. Augmentez le nombre de licences pour inviter de nouveaux utilisateurs." 
      }, { status: 400 });
    }

    // Vérifier que l'email n'est pas déjà invité
    const existingInvitation = enterprise.invitations.find(i => i.email === email);
    if (existingInvitation) {
      return NextResponse.json({ error: "Cet email a déjà une invitation en attente" }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'est pas déjà dans l'entreprise
    const existingUser = await prisma.user.findFirst({
      where: { email, enterpriseAccountId: id }
    });
    if (existingUser) {
      return NextResponse.json({ error: "Cet utilisateur fait déjà partie de l'entreprise" }, { status: 400 });
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
    expireAt.setDate(expireAt.getDate() + 7); // Expire dans 7 jours

    const invitation = await prisma.enterpriseInvitation.create({
      data: {
        enterpriseAccountId: id,
        email,
        role,
        token,
        expireAt,
      }
    });

    // TODO: Envoyer l'email d'invitation
    // await sendInvitationEmail(email, token, enterprise.nom);

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Erreur lors de la création" }, { status: 400 });
  }
}
