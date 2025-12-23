"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  exact?: boolean;
}

const advertisingTabs: Tab[] = [
  { href: "/admin/advertising", label: "Tableau de bord", exact: true },
  { href: "/admin/advertising/advertisers", label: "Annonceurs" },
  { href: "/admin/advertising/campaigns", label: "Campagnes" },
  { href: "/admin/advertising/audiences", label: "Audiences" },
  { href: "/admin/advertising/creatives", label: "Créatifs" },
];

export default function AdvertisingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (tab: Tab) => {
    if (tab.exact) {
      return pathname === tab.href;
    }
    return pathname.startsWith(tab.href);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {advertisingTabs.map((tab) => (
            <a
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                isActive(tab)
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
