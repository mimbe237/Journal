import Link from "next/link";
import { LatestEditionShowcase } from "@/components/LatestEditionShowcase";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { PricingSectionServer } from "@/components/subscriptions/PricingSectionServer";
import { prisma } from "@/lib/config/prisma";

export const dynamic = "force-dynamic";

// Fetch stats dynamically (cached for 1 hour)
async function getStats() {
  const [editionCount, userCount] = await Promise.all([
    prisma.edition.count(),
    prisma.user.count()
  ]);
  
  return [
    { label: "Éditions publiées", value: `${editionCount}+` },
    { label: "Lecteurs inscrits", value: `${userCount}+` },
    { label: "Taux de rétention", value: "92%" },
    { label: "Disponibilité", value: "99.9%" }
  ];
}

type Feature = {
  icon: string;
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    icon: "👁️",
    title: "Lecture fluide",
    description: "Zoom, défilement doux, plein écran : le lecteur s'adapte à chaque device."
  },
  {
    icon: "🔒",
    title: "PDF protégés",
    description: "Conversion en images sécurisées, accès uniquement pour les abonnés connectés."
  },
  {
    icon: "📚",
    title: "Archives indexées",
    description: "Toutes vos éditions classées, filtrables et consultables à la demande."
  },
  {
    icon: "💼",
    title: "Mode entreprise",
    description: "Comptes multi-utilisateurs, gestion centralisée et facturation groupée."
  },
  {
    icon: "⚡",
    title: "Performance 4G",
    description: "Assets optimisés, pré-chargement intelligent et cache côté lecteur."
  },
  {
    icon: "🎯",
    title: "UX claire",
    description: "Interface épurée, contrastes lisibles, feedbacks immédiats sur les actions."
  }
];

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden pb-24 pt-16 md:pt-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50 via-white to-slate-50" />
        <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-emerald-200 blur-3xl opacity-30" />
        <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-sky-200 blur-3xl opacity-30" />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 md:grid-cols-[1.1fr_0.9fr] md:px-8">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
                Plateforme de lecture numérique
              </span>
              <span className="text-xs font-semibold text-emerald-700">Edition 2025</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                Vos éditions, organisées et disponibles partout.
              </h1>
              <p className="text-lg text-slate-600 md:text-xl">
                Une expérience de lecture conçue pour les abonnés et les équipes : rapide, protégée et
                simple à déployer.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
              >
                Créer mon compte
              </Link>
              <Link
                href="/editions"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                Voir les éditions
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} />
              ))}
            </div>
          </div>

          <LatestEditionShowcase />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Pour la presse & les éditeurs</p>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Une interface claire pour vos lecteurs
              </h2>
            </div>
            <p className="max-w-xl text-slate-600">
              Le lecteur, les archives et la gestion des abonnements utilisent la même charte : couleurs
              contrastées, typographie lisible et composants cohérents.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Dynamic from database */}
      <PricingSectionServer />

      <TestimonialsSection />

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700">
            Lancer votre prochaine édition
          </div>
          <h2 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">
            Prêt à offrir une meilleure expérience de lecture ?
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Rejoignez des milliers de lecteurs qui consultent chaque jour leurs éditions dans un
            environnement clair et protégé.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
            >
              Créer mon compte
            </Link>
            <Link
              href="/editions"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Consulter les éditions
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 px-4 py-10 text-center text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <p>&copy; 2025 Journal Numérique. Tous droits réservés.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/faq" className="transition hover:text-white">FAQ</Link>
            <Link href="/terms" className="transition hover:text-white">CGU</Link>
            <Link href="/privacy" className="transition hover:text-white">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-2xl font-semibold text-emerald-600">{value}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: Feature) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg">
      <div className="mb-4 text-3xl">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-3 text-slate-600">{description}</p>
    </div>
  );
}
