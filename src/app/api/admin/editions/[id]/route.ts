import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { prisma } from '@/lib/config/prisma';
import { UserRole } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(request);

    const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT];

    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { titre, datePublication, type } = await request.json();

    if (!titre || !datePublication || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const edition = await prisma.edition.update({
      where: { id },
      data: {
        titre,
        datePublication: new Date(datePublication),
        type,
      },
    });

    return NextResponse.json({ edition });
  } catch (error: any) {
    console.error('Error updating edition:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
