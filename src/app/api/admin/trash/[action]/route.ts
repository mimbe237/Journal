import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { requireUserWithRoles } from "@/lib/auth/authorization";
import {
  trashUser,
  restoreUser,
  permanentlyDeleteUser,
  trashEnterprise,
  restoreEnterprise,
  permanentlyDeleteEnterprise,
  trashEdition,
  restoreEdition,
  permanentlyDeleteEdition,
  trashJournalType,
  restoreJournalType,
  permanentlyDeleteJournalType,
  TrashableEntity,
} from "@/modules/trash/trashService";

export const dynamic = "force-dynamic";

type ActionParams = {
  params: Promise<{ action: string }>;
};

/**
 * POST /api/admin/trash/[action]
 * Actions: trash, restore, delete
 * Body: { type: TrashableEntity, id: string }
 */
export async function POST(req: NextRequest, { params }: ActionParams) {
  try {
    const user = await requireUserWithRoles(req, undefined, [UserRole.SUPER_ADMIN]);
    const { action } = await params;
    
    const body = await req.json();
    const { type, id } = body as { type: TrashableEntity; id: string };

    if (!type || !id) {
      return NextResponse.json({ error: "Type et ID requis" }, { status: 400 });
    }

    const validTypes: TrashableEntity[] = ["user", "enterprise", "edition", "journalType", "subscription"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    switch (action) {
      case "trash":
        await handleTrash(type, id, user.id);
        return NextResponse.json({ ok: true, message: `${type} mis en corbeille` });

      case "restore":
        await handleRestore(type, id, user.id);
        return NextResponse.json({ ok: true, message: `${type} restauré` });

      case "delete":
        await handlePermanentDelete(type, id, user.id);
        return NextResponse.json({ ok: true, message: `${type} supprimé définitivement` });

      default:
        return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }
  } catch (error: any) {
    console.error(`POST /api/admin/trash/[action] error:`, error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status });
  }
}

async function handleTrash(type: TrashableEntity, id: string, userId: string) {
  switch (type) {
    case "user":
      await trashUser(id, userId);
      break;
    case "enterprise":
      await trashEnterprise(id, userId);
      break;
    case "edition":
      await trashEdition(id, userId);
      break;
    case "journalType":
      await trashJournalType(id, userId);
      break;
    case "subscription":
      // Import dynamique pour éviter les dépendances circulaires
      const { prisma } = await import("@/lib/config/prisma");
      const { addDays } = await import("date-fns");
      await prisma.subscription.update({
        where: { id },
        data: { deletedAt: new Date(), trashedUntil: addDays(new Date(), 7) },
      });
      break;
  }
}

async function handleRestore(type: TrashableEntity, id: string, userId: string) {
  switch (type) {
    case "user":
      await restoreUser(id, userId);
      break;
    case "enterprise":
      await restoreEnterprise(id, userId);
      break;
    case "edition":
      await restoreEdition(id, userId);
      break;
    case "journalType":
      await restoreJournalType(id, userId);
      break;
    case "subscription":
      const { prisma } = await import("@/lib/config/prisma");
      await prisma.subscription.update({
        where: { id },
        data: { deletedAt: null, trashedUntil: null },
      });
      break;
  }
}

async function handlePermanentDelete(type: TrashableEntity, id: string, userId: string) {
  switch (type) {
    case "user":
      await permanentlyDeleteUser(id, userId);
      break;
    case "enterprise":
      await permanentlyDeleteEnterprise(id, userId);
      break;
    case "edition":
      await permanentlyDeleteEdition(id, userId);
      break;
    case "journalType":
      await permanentlyDeleteJournalType(id, userId);
      break;
    case "subscription":
      const { prisma } = await import("@/lib/config/prisma");
      await prisma.subscription.delete({ where: { id } });
      break;
  }
}
