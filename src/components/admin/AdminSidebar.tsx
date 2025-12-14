"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon: React.ReactNode };
type NavSection = { title: string; items: NavItem[] };

// Icons
const Icons = {
  Dashboard: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Support: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Facturation: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Exports: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Subscribers: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-.895 3-2s-1.343-2-3-2-3 .895-3 2 1.343 2 3 2zm0 0v1m0 4a4 4 0 100-8 4 4 0 000 8zm6 4v-2a4 4 0 00-4-4H10a4 4 0 00-4 4v2" />
    </svg>
  ),
  Individual: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a4 4 0 100-8 4 4 0 000 8zm0 0v1m0 4a5 5 0 00-5-5H6a5 5 0 00-5 5v1h11v-1z" />
    </svg>
  ),
  Enterprise: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Subscriptions: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  NewEdition: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  ListEditions: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  BulkImport: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  PromoCodes: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  Settings: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logs: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
};

interface AdminSidebarProps {
  userRole?: string;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  // Define menus based on role
  let navSections: NavSection[] = [];

  if (userRole === "FACTURATION") {
    navSections = [
      {
        title: "Facturation",
        items: [
          { href: "/admin/facturation", label: "Tableau de bord", icon: Icons.Dashboard },
          { href: "/admin/facturation/soumissions", label: "Soumissions", icon: Icons.Facturation },
          { href: "/admin/facturation/rapports", label: "Rapports", icon: Icons.Exports },
        ]
      },
      {
        title: "Abonnements",
        items: [
          { href: "/admin/subscriptions", label: "Abonnements", icon: Icons.Subscriptions },
          { href: "/admin/subscribers", label: "Tous les abonnés", icon: Icons.Subscribers },
        ]
      },
      {
        title: "Outils",
        items: [
          { href: "/admin/exports", label: "Exports", icon: Icons.Exports },
        ]
      }
    ];
  } else if (userRole === "SUPPORT") {
    navSections = [
      {
        title: "Support",
        items: [
          { href: "/admin/support", label: "Tableau de bord", icon: Icons.Dashboard },
          { href: "/admin/users", label: "Utilisateurs", icon: Icons.Users },
          { href: "/admin/logs", label: "Journal d'activités", icon: Icons.Logs },
        ]
      },
      {
        title: "Contenu",
        items: [
          { href: "/admin/editions", label: "Nouvelle édition", icon: Icons.NewEdition },
          { href: "/admin/editions/list", label: "Gérer les éditions", icon: Icons.ListEditions },
        ]
      },
      {
        title: "Comptes",
        items: [
          { href: "/admin/subscribers", label: "Tous les abonnés", icon: Icons.Subscribers },
          { href: "/admin/enterprises", label: "Entreprises", icon: Icons.Enterprise },
        ]
      }
    ];
  } else {
    // SUPER_ADMIN or others (default view)
    navSections = [
      {
        title: "Général",
        items: [
          { href: "/admin", label: "Tableau de bord", icon: Icons.Dashboard },
          { href: "/admin/users", label: "Utilisateurs (Staff)", icon: Icons.Users },
          { href: "/admin/logs", label: "Journal d'activités", icon: Icons.Logs },
        ]
      },
      {
        title: "Abonnés",
        items: [
          { href: "/admin/subscribers", label: "Tous les abonnés", icon: Icons.Subscribers },
          { href: "/admin/subscribers/individuals", label: "Abonnés individuels", icon: Icons.Individual },
          { href: "/admin/enterprises", label: "Comptes entreprise", icon: Icons.Enterprise },
          { href: "/admin/subscriptions", label: "Abonnements", icon: Icons.Subscriptions },
        ]
      },
      {
        title: "Éditions",
        items: [
          { href: "/admin/editions", label: "Nouvelle édition", icon: Icons.NewEdition },
          { href: "/admin/editions/list", label: "Gérer les éditions", icon: Icons.ListEditions },
          { href: "/admin/editions/bulk-import", label: "Import en masse", icon: Icons.BulkImport },
        ]
      },
      {
        title: "Outils",
        items: [
          { href: "/admin/promocodes", label: "Codes promo", icon: Icons.PromoCodes },
          { href: "/admin/exports", label: "Exports", icon: Icons.Exports },
        ]
      },
      {
        title: "Configuration",
        items: [
          { href: "/admin/journal-types", label: "Types de journaux", icon: Icons.Settings },
          { href: "/admin/currencies", label: "Devises", icon: Icons.Facturation },
        ]
      }
    ];
  }

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

    return (
      <a
        key={item.href}
        href={item.href}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
          isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span className={isActive ? "text-emerald-600" : "text-slate-400"}>
          {item.icon}
        </span>
        {item.label}
      </a>
    );
  };

  const getHeaderDetails = () => {
    if (userRole === "FACTURATION") {
      return {
        title: "Facturation",
        subtitle: "Espace Facturation",
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      };
    }
    if (userRole === "SUPPORT") {
      return {
        title: "Support",
        subtitle: "Espace Support",
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }
    return {
      title: "Administration",
      subtitle: "Gestion de la plateforme",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    };
  };

  const header = getHeaderDetails();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-screen sticky top-0">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-emerald-600">
            {header.icon}
            <span className="text-lg font-bold">{header.title}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {header.subtitle}
          </p>
        </div>

        <nav className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-700">Accès rapide</p>
          <div className="mt-3 space-y-2">
            <Link
              href="/editions"
              className="block text-xs text-slate-600 hover:text-emerald-600 transition"
            >
              → Voir le kiosque
            </Link>
            <Link
              href="/dashboard"
              className="block text-xs text-slate-600 hover:text-emerald-600 transition"
            >
              → Mon tableau de bord
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
