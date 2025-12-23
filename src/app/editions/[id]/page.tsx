import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EditionReader } from "@/modules/editions/components/EditionReader";
import { EditionSummary } from "@/modules/editions/components/EditionSummary";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonSecondary } from "@/components/ui/Button";
import { getEditionById } from "@/modules/editions/editionService";
import { SocialShare } from "@/components/ui/SocialShare";

type Props = {
  params: Promise<{ id?: string }>;
};

// Helper pour typer le JSON headlines
interface Headline {
  title: string;
  page: number;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = rawId?.trim();

  if (!id) {
    return {
      title: "Édition introuvable",
    };
  }

  try {
    const edition = await getEditionById(id);

    if (!edition) {
      return {
        title: "Édition introuvable",
      };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://journal.example.com";
    const imageUrl = edition.cheminImageUne
      ? `${appUrl}/api/files/${edition.cheminImageUne}`
      : `${appUrl}/icons/icon-512x512.png`;

    return {
      title: `${edition.titre} - Journal numérique`,
      description: `Lisez l'édition "${edition.titre}" publiée le ${new Date(edition.datePublication).toLocaleDateString("fr-FR")}.`,
      openGraph: {
        title: edition.titre,
        description: `Découvrez l'édition du ${new Date(edition.datePublication).toLocaleDateString("fr-FR")}`,
        url: `${appUrl}/editions/${edition.id}`,
        siteName: "Journal Numérique",
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: edition.titre,
          },
        ],
        locale: "fr_FR",
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: edition.titre,
        description: `Lisez l'édition "${edition.titre}" sur notre plateforme numérique.`,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata for edition:", error);
    return {
      title: "Journal numérique",
    };
  }
}

// Page lecteur d'une édition. Le composant client EditionReader gère fetch + états.
export default async function EditionPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = rawId?.trim();
  if (!id) {
    // Si l'URL est invalide, on renvoie vers le kiosque.
    redirect("/editions");
  }

  const edition = await getEditionById(id);
  if (!edition) {
    redirect("/editions");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://journal.example.com";
  const shareUrl = `${appUrl}/editions/${edition.id}`;

  // Cast headlines safely
  const headlines = (edition.headlines as unknown as Headline[]) || [];
  const tags = edition.tags || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
        <PageHeader
          title="Lecteur d'édition"
          subtitle="Lecture sécurisée : accès conditionné à votre abonnement (individuel ou entreprise)."
          actions={
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <SocialShare url={shareUrl} title={edition.titre} />
              <Link href="/editions">
                <ButtonSecondary>Retour au kiosque</ButtonSecondary>
              </Link>
            </div>
          }
        />

        {/* Sommaire et Mots-clés */}
        <EditionSummary headlines={headlines} tags={tags} />

        <EditionReader editionId={id} />
      </div>
    </div>
  );
}
