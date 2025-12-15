"use client";

import Link from "next/link";
import type { UrlObject } from "url";
import { ButtonPrimary } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type EditionCardProps = {
  id: string;
  titre: string;
  datePublication: string;
  type: string;
  nombrePages: number | null;
  cheminImageUne?: string | null;
  prix?: number | null;
  devise?: string | null;
  access?: {
    status: "read" | "buy_or_subscribe" | "subscribe";
    detail?: string | null;
    coverage?: {
      type: "individual" | "enterprise";
      dateDebut: string;
      dateFin: string;
    } | null;
  };
};

// Carte simple pour le kiosque : titre, date, type, lien "Lire".
export function EditionCard({ id, titre, datePublication, type, nombrePages, cheminImageUne, prix, devise, access }: EditionCardProps) {
  const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(datePublication));
  const priceText = prix != null ? `${prix.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${devise || ""}`.trim() : null;

  const status = access?.status ?? "read";
  const detail = access?.detail;
  const coverageLabel =
    access?.coverage &&
    `${access.coverage.type === "enterprise" ? "Abonnement entreprise" : "Abonnement individuel"} : du ${new Date(access.coverage.dateDebut).toLocaleDateString("fr-FR")} au ${new Date(access.coverage.dateFin).toLocaleDateString("fr-FR")}`;

  const baseEditionHref: UrlObject = { pathname: "/editions/[id]", query: { id } };
  const buyEditionHref: UrlObject = { pathname: "/editions/[id]", query: { id, action: "buy" } };

  const primaryCta =
    status === "read"
      ? { label: "Lire l'édition", href: baseEditionHref, style: "primary" as const }
      : status === "buy_or_subscribe"
      ? { label: "Acheter cette édition", href: buyEditionHref, style: "secondary" as const }
      : { label: "S'abonner", href: "/subscriptions" as const, style: "primary" as const };

  const secondaryCta =
    status === "buy_or_subscribe"
      ? { label: "Mettre à jour mon abonnement", href: "/subscriptions" as const }
      : status === "subscribe" && priceText
      ? { label: "Achat à l'unité", href: buyEditionHref }
      : null;

  return (
    <Card className="mx-auto flex h-full max-w-sm flex-col gap-3 overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      {/* Image de Une */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-b-none bg-slate-100">
        {cheminImageUne ? (
          <img
            src={`/api/files/${cheminImageUne}`}
            alt={titre}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='400'%3E%3Crect fill='%23e2e8f0' width='300' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364748b' font-size='16'%3EPas de une%3C/text%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">
            Pas d'image
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">{titre}</h3>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">{type}</span>
      </div>
      <p className="text-sm text-slate-600">{date}</p>
      <p className="text-xs text-slate-500">{nombrePages ? `${nombrePages} pages` : "Nombre de pages à venir"}</p>
      {priceText && <p className="text-sm font-semibold text-slate-900">Prix : {priceText}</p>}

      <div className="mt-auto pt-3">
        <Link href={primaryCta.href}>
          <ButtonPrimary
            className={`w-full justify-center ${primaryCta.style === "secondary" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
          >
            {primaryCta.label}
          </ButtonPrimary>
        </Link>
        {(detail || secondaryCta || coverageLabel) && (
          <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {detail && <div>{detail}</div>}
            {coverageLabel && <div className="text-slate-500">{coverageLabel}</div>}
            {secondaryCta && (
              <Link href={secondaryCta.href} className="text-emerald-700 hover:text-emerald-900 font-semibold">
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
