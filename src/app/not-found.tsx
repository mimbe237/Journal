import Link from "next/link";
import { ButtonPrimary } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-900">
      <div className="space-y-6">
        <h1 className="text-9xl font-bold text-emerald-100 dark:text-emerald-900">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Page introuvable</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/">
            <ButtonPrimary>Retour à l'accueil</ButtonPrimary>
          </Link>
          <Link href="/editions">
            <button className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              Voir les éditions
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
