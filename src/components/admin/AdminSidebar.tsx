"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";

type NavItem = { href: string; label: string; icon: React.ReactNode; keywords?: string[] };
type NavSection = { title: string; items: NavItem[]; defaultOpen?: boolean };

// Icons
const Icons = {
  Search: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Close: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Menu: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  ChevronDown: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
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
  Email: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

interface AdminSidebarProps {
  userRole?: string;
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Define menus based on role
  let navSections: NavSection[] = [];

  if (userRole === "FACTURATION") {
    navSections = [
      {
        title: "Facturation",
        items: [
          { href: "/admin/facturation", label: "Tableau de bord", icon: Icons.Dashboard },
          { href: "/admin/subscriptions/manual/new", label: "Nouvelle soumission", icon: Icons.Facturation },
          { href: "/admin/subscriptions/manual", label: "Toutes les soumissions", icon: Icons.Facturation },
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
  } else if (userRole === "COMMERCIAL") {
    navSections = [
      {
        title: "Commercial",
        items: [
          { href: "/admin/commercial", label: "Tableau de bord", icon: Icons.Dashboard },
          { href: "/admin/subscriptions/manual/new", label: "Nouvelle soumission", icon: Icons.Facturation },
          { href: "/admin/subscriptions/manual", label: "Mes soumissions", icon: Icons.ListEditions },
        ]
      },
      {
        title: "Abonnés",
        items: [
          { href: "/admin/subscribers", label: "Tous les abonnés", icon: Icons.Subscribers },
        ]
      }
    ];
  } else if (userRole === "SUPPORT") {
    navSections = [
      {
        title: "Support",
        items: [
          { href: "/admin/support", label: "Tableau de bord", icon: Icons.Dashboard },
          { href: "/admin/facturation/soumissions", label: "Soumissions", icon: Icons.Facturation },
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
          { href: "/admin/subscriptions/manual", label: "Validation Abonnements", icon: Icons.Facturation },
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
          { href: "/admin/emails", label: "Emails", icon: Icons.Email },
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

  // Filter items based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navSections;
    
    const query = searchQuery.toLowerCase();
    return navSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.label.toLowerCase().includes(query) ||
          item.href.toLowerCase().includes(query) ||
          item.keywords?.some(k => k.toLowerCase().includes(query))
        )
      }))
      .filter(section => section.items.length > 0);
  }, [navSections, searchQuery]);

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

    return (
      <Link
        key={item.href}
        href={item.href as Route}
        onClick={() => setIsMobileOpen(false)}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
          isActive ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span className="text-base">{item.icon}</span>
        <span>{item.label}</span>
      </Link>
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
    if (userRole === "COMMERCIAL") {
      return {
        title: "Commercial",
        subtitle: "Espace Commercial",
        icon: (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

  const sidebarContent = (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600">
            {header.icon}
            <span className="text-lg font-bold">{header.title}</span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-slate-100"
          >
            {Icons.Close}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {header.subtitle}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {Icons.Search}
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              {Icons.Close}
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-4">
        {filteredSections.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Aucun résultat pour "{searchQuery}"
          </p>
        ) : (
          filteredSections.map((section) => {
            const isCollapsed = collapsedSections[section.title];
            return (
              <div key={section.title} className="space-y-2">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600 transition"
                >
                  {section.title}
                  <span className={`transform transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>
                    {Icons.ChevronDown}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {section.items.map((item) => renderItem(item))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-slate-200"
        aria-label="Ouvrir le menu"
      >
        {Icons.Menu}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r border-slate-200 bg-white min-h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
