import { notFound } from "next/navigation";
import { prisma } from "@/lib/config/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/Button";
import { getCurrentUser } from "@/lib/auth/currentUser";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { emailProvider } from "@/services/email";

// Server Action for Password Reset
async function sendResetEmail(formData: FormData) {
  "use server";
  const userId = formData.get("userId")?.toString();
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  // Generate a fake token for now (in real app, store in DB)
  const fakeToken = "reset-" + Math.random().toString(36).substring(7);
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${fakeToken}&email=${encodeURIComponent(user.email)}`;

  await emailProvider.sendEmail({
    to: user.email,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <p>Bonjour ${user.nom || ""},</p>
      <p>Une demande de réinitialisation de mot de passe a été effectuée par le support.</p>
      <p><a href="${resetLink}">Cliquez ici pour réinitialiser votre mot de passe</a></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
    `
  });
  
  console.log(`[Admin Action] Reset email sent to ${user.email}`);
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) return notFound();

  // Check permissions
  const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.FACTURATION];
  if (!allowedRoles.includes(currentUser.role)) {
    return <div className="p-8">Accès refusé</div>;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      subscriptions: {
        orderBy: { dateFin: 'desc' }
      },
      systemEvents: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });

  if (!user) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title={`Utilisateur : ${user.nom || "Sans nom"}`}
          subtitle={`Gestion du compte ${user.email}`}
        />

        <div className="grid gap-6 md:grid-cols-3">
          {/* Colonne Gauche : Infos & Actions */}
          <div className="space-y-6 md:col-span-1">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Informations</h3>
              <div className="text-sm space-y-2 text-slate-600">
                <p><span className="font-medium text-slate-900">Email:</span> {user.email}</p>
                <p><span className="font-medium text-slate-900">Rôle:</span> {user.role}</p>
                <p><span className="font-medium text-slate-900">Inscrit le:</span> {new Date(user.dateCreation).toLocaleDateString()}</p>
                <p><span className="font-medium text-slate-900">ID:</span> <span className="font-mono text-xs">{user.id}</span></p>
              </div>
            </Card>

            <Card className="p-6 space-y-4 border-orange-200 bg-orange-50">
              <h3 className="font-semibold text-orange-900">Actions Support</h3>
              <form action={sendResetEmail}>
                <input type="hidden" name="userId" value={user.id} />
                <ButtonSecondary type="submit" className="w-full justify-center bg-white border-orange-200 text-orange-700 hover:bg-orange-100">
                  Envoyer email réinitialisation
                </ButtonSecondary>
              </form>
              {/* Add more actions here like "Disable Account" */}
            </Card>
          </div>

          {/* Colonne Droite : Abonnements & Historique */}
          <div className="space-y-6 md:col-span-2">
            
            {/* Abonnements */}
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Abonnements ({user.subscriptions.length})</h3>
              {user.subscriptions.length === 0 ? (
                <p className="text-sm text-slate-500">Aucun abonnement trouvé.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {user.subscriptions.map(sub => (
                    <div key={sub.id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{sub.type} <span className="text-slate-400">({sub.statut})</span></p>
                        <p className="text-xs text-slate-500">
                          Du {new Date(sub.dateDebut).toLocaleDateString()} au {new Date(sub.dateFin).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{sub.montant} {sub.devise}</p>
                        <p className="text-xs text-slate-400">{sub.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Historique (Audit Log) */}
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Historique récent</h3>
              {user.systemEvents.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune activité enregistrée.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {user.systemEvents.map(event => (
                    <div key={event.id} className="py-2 text-sm grid grid-cols-[auto_1fr] gap-4">
                      <div className="text-slate-400 text-xs whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{event.typeEvenement}</p>
                        <p className="text-xs text-slate-500 font-mono truncate max-w-md">
                          {JSON.stringify(event.meta)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
