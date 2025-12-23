import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/prisma';
import { getCurrentUserFromRequest } from '@/lib/auth/currentUser';
import { InterestCategory } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { interests: true },
    });

    return NextResponse.json({ interests: dbUser?.interests || [] });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { interests } = body;

    if (!Array.isArray(interests)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }

    // Validate that all interests are valid enum values
    const validInterests = Object.values(InterestCategory);
    const areValid = interests.every((i: any) => validInterests.includes(i));

    if (!areValid) {
      return NextResponse.json({ error: 'Intérêts invalides' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { interests: interests as InterestCategory[] },
      select: { interests: true },
    });

    return NextResponse.json({ interests: updatedUser.interests });
  } catch (error) {
    console.error('Error updating interests:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
