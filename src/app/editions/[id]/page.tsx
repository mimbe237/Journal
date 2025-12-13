import Link from "next/link";
import { redirect } from "next/navigation";
import { EditionReader } from "@/modules/editions/components/EditionReader";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonSecondary } from "@/components/ui/Button";

// Page lecteur d'une édition. Le composant client EditionReader gère fetch + états.
export default async function EditionPage({ params }: { params: Promise<{ id?: string }> }) {
  const { id: rawId } = await params;
  const id = rawId?.trim();
  if (!id) {
    // Si l'URL est invalide, on renvoie vers le kiosque.
    redirect("/editions");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
        <PageHeader
          title="Lecteur d'édition"
          subtitle="Lecture sécurisée : accès conditionné à votre abonnement (individuel ou entreprise)."
          actions={
            <Link href="/editions">
              <ButtonSecondary>Retour au kiosque</ButtonSecondary>
            </Link>
          }
        />

        <EditionReader editionId={id} />
      </div>
    </div>
  );
}
