import { prisma, prismaRuntimeReady } from "@/lib/config/prisma";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole } from "@prisma/client";
import NewSubscriberForm from "./NewSubscriberForm";
import Link from "next/link";

export default async function NewSubscriberPage() {
  const currentUser = await getCurrentUser();
  const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];
  if (!currentUser || !allowedRoles.includes(currentUser.role as UserRole)) {
    return <div className="p-8 text-slate-700">Accès refusé</div>;
  }

  await prismaRuntimeReady;

  const enterprises = await prisma.enterpriseAccount.findMany({
    orderBy: { nom: "asc" },
    select: { id: true, nom: true }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Nouvel abonné</h1>
            <p className="text-sm text-slate-600">Créez un abonné manuel et son abonnement.</p>
          </div>
          <Link href="/admin/subscribers" className="text-sm text-emerald-700 hover:text-emerald-900">
            ← Retour à la liste
          </Link>
        </div>
        <NewSubscriberForm enterprises={enterprises} />
      </div>
    </div>
  );
}
