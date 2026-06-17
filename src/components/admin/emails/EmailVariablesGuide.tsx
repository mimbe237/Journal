"use client";

import { useState } from "react";

export function EmailVariablesGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <span className="mr-2">📚</span>
        Guide des variables
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl ring-1 ring-slate-900/5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Guide des variables de personnalisation</h2>
                <p className="text-sm text-slate-500">Utilisez ces expressions dans vos modèles d'emails (Sujet ou Corps).</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-8">
                
                {/* Section: Utilisateur */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">1</span>
                    Informations Abonné / Utilisateur
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Variable</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Description</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Exemple de résultat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{user.nom}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Nom complet de l'utilisateur</td>
                          <td className="px-4 py-2 text-slate-500">Jean Dupont</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{user.email}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Adresse email</td>
                          <td className="px-4 py-2 text-slate-500">jean@example.com</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{user.role}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Rôle sur la plateforme</td>
                          <td className="px-4 py-2 text-slate-500">ABONNE</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section: Abonnement */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">2</span>
                    Détails de l'abonnement
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Variable</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Description</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Exemple de résultat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{subscription.plan}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Nom de la formule (ex: Mensuel, Annuel)</td>
                          <td className="px-4 py-2 text-slate-500">Abonnement Annuel</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{subscription.status}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Statut actuel</td>
                          <td className="px-4 py-2 text-slate-500">ACTIF</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{subscription.startDate}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Date de début</td>
                          <td className="px-4 py-2 text-slate-500">01/01/2025</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{subscription.endDate}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Date de fin / renouvellement</td>
                          <td className="px-4 py-2 text-slate-500">31/12/2025</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{subscription.daysRemaining}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Jours restants avant expiration</td>
                          <td className="px-4 py-2 text-slate-500">15</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{subscription.price}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Montant de l'abonnement</td>
                          <td className="px-4 py-2 text-slate-500">5000 XOF</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section: Entreprise */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">3</span>
                    Entreprise (si applicable)
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Variable</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Description</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Exemple de résultat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{enterprise.name}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Nom de l'entreprise</td>
                          <td className="px-4 py-2 text-slate-500">Acme Corp</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{enterprise.userCount}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Nombre d'utilisateurs actifs</td>
                          <td className="px-4 py-2 text-slate-500">12</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section: Système */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">4</span>
                    Système & Liens
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Variable</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Description</th>
                          <th className="px-4 py-2 text-left font-medium text-slate-700">Exemple de résultat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{app.name}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Nom de l'application</td>
                          <td className="px-4 py-2 text-slate-500">Journal Numérique</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{app.url}}`}</td>
                          <td className="px-4 py-2 text-slate-600">URL de base</td>
                          <td className="px-4 py-2 text-slate-500">https://journal.com</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{action_url}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Lien d'action principal (ex: bouton de confirmation)</td>
                          <td className="px-4 py-2 text-slate-500">https://.../verify?token=...</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-mono text-blue-600">{`{{date.today}}`}</td>
                          <td className="px-4 py-2 text-slate-600">Date du jour</td>
                          <td className="px-4 py-2 text-slate-500">17/12/2025</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section: Logique conditionnelle */}
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs">5</span>
                    Logique Conditionnelle (Avancé)
                  </h3>
                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="mb-2">Vous pouvez afficher du contenu conditionnel en utilisant la syntaxe Handlebars/Mustache :</p>
                    <pre className="block overflow-x-auto rounded bg-slate-800 p-3 text-slate-100">
{`{{#if subscription.daysRemaining < 7}}
  Attention : Votre abonnement expire bientôt !
{{/if}}

{{#unless user.nom}}
  Bonjour cher abonné,
{{else}}
  Bonjour {{user.nom}},
{{/unless}}`}
                    </pre>
                  </div>
                </section>

              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-right">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Fermer le guide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
