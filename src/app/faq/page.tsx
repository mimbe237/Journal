'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Abonnement
  {
    id: '1',
    category: 'Abonnement',
    question: 'Comment souscrire à un abonnement ?',
    answer: 'Pour souscrire, connectez-vous à votre compte, rendez-vous dans la section "Abonnements", choisissez le type de journal souhaité et la durée d\'abonnement, puis procédez au paiement via les méthodes disponibles (Mobile Money, virement bancaire ou carte).',
  },
  {
    id: '2',
    category: 'Abonnement',
    question: 'Quels sont les types d\'abonnement disponibles ?',
    answer: 'Nous proposons des abonnements mensuels, trimestriels, semestriels et annuels. Les abonnements plus longs bénéficient de tarifs préférentiels. Les comptes entreprise peuvent également bénéficier de tarifs spéciaux selon le nombre d\'utilisateurs.',
  },
  {
    id: '3',
    category: 'Abonnement',
    question: 'Comment annuler mon abonnement ?',
    answer: 'Vous pouvez gérer votre abonnement depuis la page "Mon abonnement" dans votre profil. L\'annulation prend effet à la fin de la période en cours. Pour les comptes entreprise, veuillez contacter notre support.',
  },
  {
    id: '4',
    category: 'Abonnement',
    question: 'Mon abonnement expire bientôt, comment le renouveler ?',
    answer: 'Vous recevrez un email de rappel 7 jours avant l\'expiration. Pour renouveler, rendez-vous sur votre tableau de bord et cliquez sur "Renouveler". Si vous avez activé le renouvellement automatique, votre abonnement sera renouvelé automatiquement.',
  },
  // Paiement
  {
    id: '5',
    category: 'Paiement',
    question: 'Quelles sont les méthodes de paiement acceptées ?',
    answer: 'Nous acceptons : Mobile Money (MTN, Orange, etc.), virement bancaire, et les cartes de crédit/débit. Le choix des méthodes peut varier selon votre pays.',
  },
  {
    id: '6',
    category: 'Paiement',
    question: 'Comment effectuer un paiement Mobile Money ?',
    answer: 'Sélectionnez "Mobile Money" lors du paiement, entrez votre numéro de téléphone, puis validez. Vous recevrez une demande de confirmation sur votre téléphone. Une fois le paiement confirmé, votre abonnement sera activé automatiquement.',
  },
  {
    id: '7',
    category: 'Paiement',
    question: 'Mon paiement est en attente de validation, que faire ?',
    answer: 'Les paiements par virement bancaire nécessitent une validation manuelle qui peut prendre 24-48h ouvrées. Une fois validé, vous recevrez un email de confirmation et votre abonnement sera activé.',
  },
  {
    id: '8',
    category: 'Paiement',
    question: 'Puis-je obtenir un remboursement ?',
    answer: 'Les remboursements sont possibles dans les 7 jours suivant la souscription si vous n\'avez pas accédé aux éditions. Contactez notre support avec votre référence de paiement pour toute demande de remboursement.',
  },
  // Lecture
  {
    id: '9',
    category: 'Lecture',
    question: 'Comment accéder aux éditions ?',
    answer: 'Une fois abonné, accédez au "Kiosque" depuis votre tableau de bord. Vous y trouverez toutes les éditions auxquelles vous avez accès. Cliquez sur une édition pour l\'ouvrir dans notre lecteur.',
  },
  {
    id: '10',
    category: 'Lecture',
    question: 'Puis-je télécharger les éditions ?',
    answer: 'Le téléchargement n\'est pas disponible pour le moment. Cependant, notre lecteur fonctionne hors-ligne une fois l\'édition chargée, et vous pouvez reprendre votre lecture là où vous l\'aviez laissée.',
  },
  {
    id: '11',
    category: 'Lecture',
    question: 'Sur combien d\'appareils puis-je lire ?',
    answer: 'Les abonnements individuels permettent la connexion sur 3 appareils simultanément. Les comptes entreprise ont des limites personnalisées selon leur forfait.',
  },
  // Compte
  {
    id: '12',
    category: 'Compte',
    question: 'Comment modifier mes informations personnelles ?',
    answer: 'Rendez-vous dans "Mon profil" depuis le menu utilisateur. Vous pouvez y modifier votre nom, email, mot de passe et préférences de notification.',
  },
  {
    id: '13',
    category: 'Compte',
    question: 'J\'ai oublié mon mot de passe, que faire ?',
    answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Entrez votre email et vous recevrez un lien pour réinitialiser votre mot de passe. Ce lien est valide 1 heure.',
  },
  {
    id: '14',
    category: 'Compte',
    question: 'Comment supprimer mon compte ?',
    answer: 'Pour supprimer votre compte, contactez notre support. Notez que cette action est irréversible et entraînera la perte de votre historique d\'abonnement.',
  },
  // Entreprise
  {
    id: '15',
    category: 'Entreprise',
    question: 'Comment créer un compte entreprise ?',
    answer: 'Contactez notre équipe commerciale via le formulaire de contact ou par email. Nous vous proposerons un devis personnalisé selon le nombre d\'utilisateurs souhaité.',
  },
  {
    id: '16',
    category: 'Entreprise',
    question: 'Comment ajouter des utilisateurs à mon compte entreprise ?',
    answer: 'En tant qu\'administrateur entreprise, accédez à "Gérer les utilisateurs" depuis votre tableau de bord. Vous pouvez inviter des collaborateurs par email ou générer des codes d\'invitation.',
  },
];

const CATEGORIES = [...new Set(FAQ_DATA.map(item => item.category))];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFAQ = FAQ_DATA.filter(item => {
    const matchesSearch = searchQuery
      ? item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesCategory = selectedCategory
      ? item.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  const groupedFAQ = filteredFAQ.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord
          </Link>

          <h1 className="text-3xl font-bold text-slate-900">
            Foire aux questions
          </h1>
          <p className="mt-2 text-slate-600">
            Trouvez rapidement des réponses à vos questions les plus courantes
          </p>

          {/* Search */}
          <div className="mt-8 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question..."
              className="w-full pl-12 pr-4 py-3 text-lg border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Categories */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                !selectedCategory
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              Toutes
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition ${
                  selectedCategory === category
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {Object.keys(groupedFAQ).length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-slate-600">
              Aucun résultat pour "{searchQuery}"
            </p>
          </div>
        ) : (
          Object.entries(groupedFAQ).map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {category}
              </h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition"
                    >
                      <span className="font-medium text-slate-900 pr-4">
                        {item.question}
                      </span>
                      <svg
                        className={`h-5 w-5 text-slate-400 flex-shrink-0 transition-transform ${
                          openItems.has(item.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openItems.has(item.id) && (
                      <div className="px-5 pb-5">
                        <p className="text-slate-600 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Contact section */}
        <div className="mt-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-xl font-bold">
            Vous n'avez pas trouvé de réponse ?
          </h3>
          <p className="mt-2 text-emerald-100">
            Notre équipe support est disponible pour vous aider
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="mailto:support@journal.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-50 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
