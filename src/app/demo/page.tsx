import { Metadata } from "next";
import Link from "next/link";
import { DemoEditionReader } from "./DemoEditionReader";

export const metadata: Metadata = {
  title: "Aperçu démo — Journal Numérique",
  description: "Découvrez la dernière édition du journal numérique en accès libre. Feuilletez, zoomez, lisez sans inscription.",
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Bandeau supérieur */}
      <div className="bg-blue-700 text-white text-sm py-2 px-4 flex items-center justify-between gap-4">
        <span className="font-medium">
          📖 Aperçu gratuit — Dernière édition publiée
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/auth/register"
            className="bg-white text-blue-700 font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors text-xs"
          >
            S'abonner
          </Link>
          <Link
            href="/"
            className="text-blue-200 hover:text-white transition-colors text-xs"
          >
            Accueil
          </Link>
        </div>
      </div>

      {/* Lecteur pleine hauteur */}
      <div className="flex-1">
        <DemoEditionReader />
      </div>
    </div>
  );
}
