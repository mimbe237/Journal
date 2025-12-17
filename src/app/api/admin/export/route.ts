import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUser } from '@/lib/auth/currentUser';
import { UserRole, SubscriptionStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions admin
    const allowedRoles: UserRole[] = [
      UserRole.SUPER_ADMIN,
      UserRole.FACTURATION,
    ];

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'users';
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status') as SubscriptionStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let data: Record<string, unknown>[] = [];
    let columns: { key: string; label: string }[] = [];
    let filename = '';

    // Date filters
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    switch (type) {
      case 'users': {
        const users = await prisma.user.findMany({
          where: {
            role: {
              in: [UserRole.ABONNE, UserRole.COMPTE_ENTREPRISE],
            },
            deletedAt: null,
            ...(Object.keys(dateFilter).length > 0 ? { dateCreation: dateFilter } : {}),
          },
          select: {
            id: true,
            email: true,
            nom: true,
            telephone: true,
            pays: true,
            role: true,
            dateCreation: true,
          },
          orderBy: { dateCreation: 'desc' },
        });

        data = users.map((u) => ({
          id: u.id,
          email: u.email,
          nom: u.nom || '',
          telephone: u.telephone || '',
          pays: u.pays || '',
          role: u.role,
          dateCreation: u.dateCreation.toISOString(),
        }));

        columns = [
          { key: 'id', label: 'ID' },
          { key: 'email', label: 'Email' },
          { key: 'nom', label: 'Nom' },
          { key: 'telephone', label: 'Téléphone' },
          { key: 'pays', label: 'Pays' },
          { key: 'role', label: 'Rôle' },
          { key: 'dateCreation', label: 'Date de création' },
        ];
        filename = 'export_utilisateurs';
        break;
      }

      case 'subscriptions': {
        const whereClause: {
          statut?: SubscriptionStatus;
          dateDebut?: { gte?: Date; lte?: Date };
          deletedAt?: null;
        } = { deletedAt: null };
        
        if (status) whereClause.statut = status;
        if (Object.keys(dateFilter).length > 0) whereClause.dateDebut = dateFilter;

        const subscriptions = await prisma.subscription.findMany({
          where: whereClause,
          select: {
            id: true,
            statut: true,
            type: true,
            dateDebut: true,
            dateFin: true,
            montant: true,
            devise: true,
            source: true,
            user: {
              select: {
                email: true,
                nom: true,
              },
            },
          },
          orderBy: { dateDebut: 'desc' },
        });

        data = subscriptions.map((s) => ({
          id: s.id,
          userEmail: s.user?.email || '',
          userName: s.user?.nom || '',
          type: s.type,
          statut: s.statut,
          dateDebut: s.dateDebut?.toISOString() || '',
          dateFin: s.dateFin?.toISOString() || '',
          montant: Number(s.montant) || 0,
          devise: s.devise,
          source: s.source,
        }));

        columns = [
          { key: 'id', label: 'ID' },
          { key: 'userEmail', label: 'Email utilisateur' },
          { key: 'userName', label: 'Nom utilisateur' },
          { key: 'type', label: 'Type abonnement' },
          { key: 'statut', label: 'Statut' },
          { key: 'dateDebut', label: 'Date début' },
          { key: 'dateFin', label: 'Date fin' },
          { key: 'montant', label: 'Montant' },
          { key: 'devise', label: 'Devise' },
          { key: 'source', label: 'Source' },
        ];
        filename = 'export_abonnements';
        break;
      }

      case 'payments': {
        const payments = await prisma.paymentTransaction.findMany({
          where: {
            ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
          },
          select: {
            id: true,
            referenceExterne: true,
            montant: true,
            devise: true,
            statut: true,
            createdAt: true,
            user: {
              select: {
                email: true,
                nom: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        data = payments.map((p) => ({
          id: p.id,
          reference: p.referenceExterne || '',
          userEmail: p.user?.email || '',
          userName: p.user?.nom || '',
          montant: Number(p.montant) || 0,
          devise: p.devise,
          statut: p.statut,
          createdAt: p.createdAt?.toISOString() || '',
        }));

        columns = [
          { key: 'id', label: 'ID' },
          { key: 'reference', label: 'Référence' },
          { key: 'userEmail', label: 'Email utilisateur' },
          { key: 'userName', label: 'Nom utilisateur' },
          { key: 'montant', label: 'Montant' },
          { key: 'devise', label: 'Devise' },
          { key: 'statut', label: 'Statut' },
          { key: 'createdAt', label: 'Date transaction' },
        ];
        filename = 'export_paiements';
        break;
      }

      case 'enterprises': {
        const enterprises = await prisma.enterpriseAccount.findMany({
          where: {
            ...(Object.keys(dateFilter).length > 0 ? { dateCreation: dateFilter } : {}),
          },
          select: {
            id: true,
            nom: true,
            contactEmail: true,
            contactTelephone: true,
            actif: true,
            nombreUtilisateursInclus: true,
            dateCreation: true,
          },
          orderBy: { dateCreation: 'desc' },
        });

        data = enterprises.map((e) => ({
          id: e.id,
          nom: e.nom,
          email: e.contactEmail || '',
          telephone: e.contactTelephone || '',
          actif: e.actif ? 'Oui' : 'Non',
          nombreUtilisateurs: e.nombreUtilisateursInclus,
          dateCreation: e.dateCreation.toISOString(),
        }));

        columns = [
          { key: 'id', label: 'ID' },
          { key: 'nom', label: 'Nom' },
          { key: 'email', label: 'Email contact' },
          { key: 'telephone', label: 'Téléphone' },
          { key: 'actif', label: 'Actif' },
          { key: 'nombreUtilisateurs', label: 'Utilisateurs inclus' },
          { key: 'dateCreation', label: 'Date de création' },
        ];
        filename = 'export_entreprises';
        break;
      }

      default:
        return NextResponse.json({ error: 'Type d\'export non supporté' }, { status: 400 });
    }

    // Generate CSV
    if (format === 'csv') {
      const header = columns.map((c) => c.label).join(';');
      const rows = data.map((row) =>
        columns.map((c) => {
          const value = row[c.key];
          // Escape special characters for CSV
          if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(';')
      );

      const csv = [header, ...rows].join('\n');
      const date = new Date().toISOString().split('T')[0];

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}_${date}.csv"`,
        },
      });
    }

    // Return JSON if not CSV
    return NextResponse.json({ data, columns, filename });
  } catch (error) {
    console.error('Error exporting:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}
