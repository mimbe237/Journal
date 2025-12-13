import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                  📰 Plateforme de lecture numérique
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Vos éditions, <span className="text-emerald-600">toujours à portée</span>
                </h1>
              </div>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                Accédez aux éditions du jour, explorez nos archives complètes et lisez depuis n'importe quel appareil. Une expérience fluide et sécurisée pour les abonnés individuels et les entreprises.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/auth/register" className="inline-flex">
                  <button className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition shadow-lg hover:shadow-xl">
                    Commencer gratuitement
                  </button>
                </Link>
                <Link href="/editions" className="inline-flex">
                  <button className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition">
                    Voir les éditions
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8">
                <StatBox label="Éditions" value="250+" />
                <StatBox label="Lecteurs" value="12k+" />
                <StatBox label="Rétention" value="92%" />
              </div>
            </div>

            <div className="relative h-96 md:h-full min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl shadow-2xl transform rotate-3"></div>
              <div className="absolute inset-4 bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="h-full flex items-center justify-center text-slate-400">
                  <div className="text-center space-y-2">
                    <div className="text-6xl">📱</div>
                    <p className="text-sm font-medium">Aperçu de la plateforme</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">
              Pourquoi choisir notre plateforme ?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Une expérience de lecture moderne pour vos contenus numériques
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon="📖"
              title="Lecture immersive"
              description="Images haute qualité avec zoom et plein écran. Navigation fluide page par page pour une expérience de lecture optimale."
            />
            <FeatureCard
              icon="🔒"
              title="Sécurité renforcée"
              description="Protection anti-piratage avec PDF converti en images sécurisées. Vos contenus sont protégés."
            />
            <FeatureCard
              icon="💼"
              title="Solution B2B"
              description="Comptes entreprises multi-utilisateurs, bibliothèques et institutions. Gestion centralisée des abonnements."
            />
            <FeatureCard
              icon="📊"
              title="Statistiques détaillées"
              description="Suivez les lectures, analysez l'engagement et optimisez votre contenu avec nos outils d'analytics."
            />
            <FeatureCard
              icon="🌐"
              title="Multi-plateformes"
              description="Accessible sur ordinateur, tablette et smartphone. Synchronisation automatique entre tous vos appareils."
            />
            <FeatureCard
              icon="⚡"
              title="Performance optimale"
              description="Chargement rapide, navigation fluide et expérience utilisateur soignée sur tous les supports."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-slate-900">
              Choisissez votre formule
            </h2>
            <p className="text-xl text-slate-600">
              Des tarifs simples et transparents pour tous
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <PricingCard
              title="Mensuel"
              price="9.99€"
              period="mois"
              features={[
                "Accès complet aux éditions",
                "Lecture multi-plateformes",
                "Support prioritaire",
                "Sans engagement"
              ]}
              cta="S'abonner"
            />
            <PricingCard
              title="Annuel"
              price="99€"
              period="an"
              features={[
                "Accès complet aux éditions",
                "Lecture multi-plateformes",
                "Support prioritaire",
                "2 mois offerts"
              ]}
              cta="S'abonner"
              featured
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-600">
        <div className="mx-auto max-w-4xl px-4 md:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Rejoignez des milliers de lecteurs qui font confiance à notre plateforme
          </p>
          <Link href="/auth/register">
            <button className="px-10 py-4 bg-white text-emerald-600 font-bold rounded-lg hover:bg-emerald-50 transition shadow-xl text-lg">
              Créer mon compte gratuitement
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Components
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600 mt-1">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition group">
      <div className="text-4xl mb-4 group-hover:scale-110 transition">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function PricingCard({
  title,
  price,
  period,
  features,
  cta,
  featured = false
}: {
  title: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-2xl ${
        featured
          ? "bg-emerald-600 text-white shadow-2xl ring-4 ring-emerald-300 scale-105"
          : "bg-white text-slate-900 shadow-lg"
      }`}
    >
      {featured && (
        <div className="text-center mb-4">
          <span className="inline-block bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            RECOMMANDÉ
          </span>
        </div>
      )}
      
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-5xl font-bold">{price}</span>
        <span className={`text-lg ${featured ? "text-emerald-100" : "text-slate-500"}`}>/{period}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`text-xl ${featured ? "text-emerald-300" : "text-emerald-600"}`}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/auth/register"
        className={`block w-full py-3 text-center font-semibold rounded-lg transition ${
          featured
            ? "bg-white text-emerald-600 hover:bg-emerald-50"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
