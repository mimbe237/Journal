"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/config/prisma";
import { 
  UserRole, 
  SubscriptionType, 
  SubscriptionStatus, 
  SubscriptionSource, 
  SystemEventType 
} from "@prisma/client";
import { addDays } from "date-fns";

// Helper to check permissions
async function checkPermission(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error("Non autorisé");
  }
  return user;
}

// Helper to log system event
async function logEvent(
  userId: string, 
  type: SystemEventType, 
  meta: any
) {
  await prisma.systemEvent.create({
    data: {
      typeEvenement: type,
      userId,
      meta,
      ip: "unknown" // In server actions, getting IP is harder, maybe pass it or ignore for now
    }
  });
}

export async function getUserRole() {
  const user = await getCurrentUser();
  return user?.role;
}

export async function createSubscription(formData: FormData) {
  const user = await checkPermission([UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION]);

  const userId = formData.get("userId")?.toString();
  const type = formData.get("type")?.toString() as SubscriptionType;
  const dateDebut = new Date(formData.get("dateDebut")?.toString() || "");
  const dateFin = new Date(formData.get("dateFin")?.toString() || "");
  const montant = parseFloat(formData.get("montant")?.toString() || "0");
  const devise = formData.get("devise")?.toString() || "XOF";
  const source = formData.get("source")?.toString() as SubscriptionSource || "OFFLINE";

  if (!userId || !type || !dateDebut || !dateFin) {
    return { error: "Champs requis manquants" };
  }

  try {
    const sub = await prisma.subscription.create({
      data: {
        userId,
        type,
        statut: SubscriptionStatus.ACTIF,
        dateDebut,
        dateFin,
        montant,
        devise,
        source,
      }
    });

    await logEvent(user.id, SystemEventType.CREATION_ABONNEMENT, {
      subscriptionId: sub.id,
      targetUserId: userId,
      action: "create",
      details: { type, montant, devise }
    });

    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Erreur lors de la création" };
  }
}

export async function updateSubscription(formData: FormData) {
  const user = await checkPermission([UserRole.SUPER_ADMIN, UserRole.SUPPORT]);

  const id = formData.get("id")?.toString();
  const type = formData.get("type")?.toString() as SubscriptionType;
  const statut = formData.get("statut")?.toString() as SubscriptionStatus;
  const dateFin = new Date(formData.get("dateFin")?.toString() || "");
  
  if (!id) return { error: "ID requis" };

  try {
    const oldSub = await prisma.subscription.findUnique({ where: { id } });
    
    const sub = await prisma.subscription.update({
      where: { id },
      data: {
        type,
        statut,
        dateFin
      }
    });

    await logEvent(user.id, SystemEventType.MODIFICATION_ABONNEMENT, {
      subscriptionId: sub.id,
      targetUserId: sub.userId,
      action: "update",
      changes: {
        from: { type: oldSub?.type, statut: oldSub?.statut, dateFin: oldSub?.dateFin },
        to: { type, statut, dateFin }
      }
    });

    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (e) {
    return { error: "Erreur lors de la modification" };
  }
}

export async function softDeleteSubscription(id: string) {
  const user = await checkPermission([UserRole.SUPER_ADMIN, UserRole.SUPPORT]);

  try {
    const sub = await prisma.subscription.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        trashedUntil: addDays(new Date(), 30)
      }
    });

    await logEvent(user.id, SystemEventType.SUPPRESSION_ABONNEMENT, {
      subscriptionId: sub.id,
      targetUserId: sub.userId,
      action: "soft_delete",
      trashedUntil: sub.trashedUntil
    });

    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (e) {
    return { error: "Erreur lors de la suppression" };
  }
}

export async function restoreSubscription(id: string) {
  const user = await checkPermission([UserRole.SUPER_ADMIN, UserRole.SUPPORT]);

  try {
    const sub = await prisma.subscription.update({
      where: { id },
      data: {
        deletedAt: null,
        trashedUntil: null
      }
    });

    await logEvent(user.id, SystemEventType.RESTAURATION_ABONNEMENT, {
      subscriptionId: sub.id,
      targetUserId: sub.userId,
      action: "restore"
    });

    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (e) {
    return { error: "Erreur lors de la restauration" };
  }
}

export async function hardDeleteSubscription(id: string) {
  const user = await checkPermission([UserRole.SUPER_ADMIN, UserRole.SUPPORT]);

  try {
    const sub = await prisma.subscription.delete({
      where: { id }
    });

    await logEvent(user.id, SystemEventType.SUPPRESSION_DEFINITIVE_ABONNEMENT, {
      subscriptionId: id, // ID might not be useful anymore but good for reference
      targetUserId: sub.userId,
      action: "hard_delete"
    });

    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (e) {
    return { error: "Erreur lors de la suppression définitive" };
  }
}
