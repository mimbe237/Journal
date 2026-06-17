"use client";

import { useEffect, useState } from "react";

type AdBannerData = {
  hasAd: boolean;
  imageUrl?: string;
  clickUrl?: string;
  altText?: string;
  campaignId?: string;
  creativeId?: string;
};

type AdBannerProps = {
  className?: string;
  position?: "top" | "bottom" | "sidebar";
};

/**
 * Composant de bannière publicitaire pour l'espace abonné.
 * Charge dynamiquement une pub ciblée depuis l'API.
 */
export function AdBanner({ className = "", position = "bottom" }: AdBannerProps) {
  const [adData, setAdData] = useState<AdBannerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAd() {
      try {
        const response = await fetch("/api/ads/banner");
        const data = await response.json();
        setAdData(data);
      } catch (error) {
        console.error("Erreur lors du chargement de la pub:", error);
        setAdData({ hasAd: false });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAd();
  }, []);

  // Enregistrer le clic
  const handleClick = async () => {
    if (!adData?.campaignId || !adData?.creativeId) return;

    try {
      await fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: adData.campaignId,
          creativeId: adData.creativeId,
          channel: "in_app",
        }),
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du clic:", error);
    }
  };

  // Ne rien afficher si pas de pub ou en chargement
  if (isLoading || !adData?.hasAd) {
    return null;
  }

  const positionStyles = {
    top: "mb-4",
    bottom: "mt-4",
    sidebar: "my-2",
  };

  return (
    <div
      className={`ad-banner rounded-lg overflow-hidden bg-gray-50 ${positionStyles[position]} ${className}`}
    >
      <a
        href={adData.clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block"
      >
        <img
          src={adData.imageUrl}
          alt={adData.altText || "Publicité"}
          className="w-full h-auto"
          loading="lazy"
        />
      </a>
      <p className="text-center text-xs text-gray-400 py-1">Publicité</p>
    </div>
  );
}

/**
 * Composant de bannière publicitaire statique (pour SSR ou préchargement).
 * Utilise les données passées en props plutôt que de les charger dynamiquement.
 */
export function StaticAdBanner({
  imageUrl,
  clickUrl,
  altText,
  campaignId,
  creativeId,
  className = "",
}: {
  imageUrl: string;
  clickUrl: string;
  altText?: string;
  campaignId: string;
  creativeId: string;
  className?: string;
}) {
  const handleClick = async () => {
    try {
      await fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          creativeId,
          channel: "in_app",
        }),
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du clic:", error);
    }
  };

  return (
    <div className={`ad-banner rounded-lg overflow-hidden bg-gray-50 ${className}`}>
      <a
        href={clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block"
      >
        <img
          src={imageUrl}
          alt={altText || "Publicité"}
          className="w-full h-auto"
          loading="lazy"
        />
      </a>
      <p className="text-center text-xs text-gray-400 py-1">Publicité</p>
    </div>
  );
}
