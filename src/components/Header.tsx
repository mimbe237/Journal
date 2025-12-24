"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/lib/hooks/useTheme";
import { GlobalSearch } from "@/components/search/GlobalSearch";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nom: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStaff = user?.role === "SUPER_ADMIN" || user?.role === "FACTURATION" || user?.role === "SUPPORT";
  const staffDashboardPath = user
    ? user.role === "FACTURATION"
      ? "/admin/facturation"
      : user.role === "SUPPORT"
        ? "/admin/support"
        : "/admin"
    : "/admin";

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        // User not logged in
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname]);

  useEffect(() => {
    if (!user || !pathname) return;
    
    // Allow staff to access specific public/user pages
    const allowedPaths = ["/editions", "/dashboard", "/profile", "/subscriptions", "/faq"];
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

    if (isStaff && !pathname.startsWith("/admin") && !isAllowedPath) {
      router.replace(staffDashboardPath);
    }
  }, [user, pathname, router, isStaff, staffDashboardPath]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  }

  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) return null;

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4 md:px-8">
        <Link href="/" className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
          Journal Numérique
        </Link>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-expanded={mobileMenuOpen}
        >
          <span className="sr-only">Ouvrir le menu</span>
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Toggle thème visible en mobile */}
        <div className="md:hidden ml-2">
          <ThemeToggle className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="w-64">
            <GlobalSearch />
          </div>

          {!loading && user ? (
            <>
              {!isStaff && (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium ${
                      pathname === "/dashboard"
                        ? "text-emerald-600"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    href="/editions"
                    className={`text-sm font-medium ${
                      pathname?.startsWith("/editions")
                        ? "text-emerald-600"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Éditions
                  </Link>
                  <Link
                    href="/subscriptions"
                    className={`text-sm font-medium ${
                      pathname?.startsWith("/subscriptions")
                        ? "text-emerald-600"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Abonnements
                  </Link>
                  <Link
                    href="/faq"
                    className={`text-sm font-medium ${
                      pathname === "/faq"
                        ? "text-emerald-600"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    FAQ
                  </Link>
                </>
              )}
              {user.role === "COMPTE_ENTREPRISE" && (
                <Link
                  href="/enterprise/dashboard"
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    pathname?.startsWith("/enterprise")
                      ? "bg-purple-600 text-white"
                      : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Mon Entreprise
                </Link>
              )}
              {isStaff && !pathname?.startsWith("/admin") && (
                <Link
                  href={staffDashboardPath}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                    pathname === staffDashboardPath
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  }`}
                >
                  Tableau de bord
                </Link>
              )}
              <Link
                href="/profile"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  pathname?.startsWith("/profile")
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Profil
              </Link>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <span className="text-sm text-slate-600 dark:text-slate-400">{user.nom}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link
                href="/faq"
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                FAQ
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                S'inscrire
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700">
          <div className="space-y-1 px-4 py-4">
            <div className="mb-4">
              <GlobalSearch />
            </div>
            {!loading && user ? (
              <>
                <div className="pb-3 mb-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{user.nom}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                {!isStaff && (
                  <>
                    <Link
                      href="/dashboard"
                      className={`block rounded-md px-3 py-2 text-base font-medium ${
                        pathname === "/dashboard"
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Tableau de bord
                    </Link>
                    <Link
                      href="/editions"
                      className={`block rounded-md px-3 py-2 text-base font-medium ${
                        pathname?.startsWith("/editions")
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Éditions
                    </Link>
                    <Link
                      href="/subscriptions"
                      className={`block rounded-md px-3 py-2 text-base font-medium ${
                        pathname?.startsWith("/subscriptions")
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Abonnements
                    </Link>
                    <Link
                      href="/faq"
                      className={`block rounded-md px-3 py-2 text-base font-medium ${
                        pathname === "/faq"
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      FAQ
                    </Link>
                  </>
                )}
                {user.role === "COMPTE_ENTREPRISE" && (
                  <Link
                    href="/enterprise/dashboard"
                    className={`block rounded-md px-3 py-2 text-base font-medium ${
                      pathname?.startsWith("/enterprise")
                        ? "bg-purple-50 text-purple-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Mon Entreprise
                  </Link>
                )}
                {isStaff && (
                  <Link
                    href={staffDashboardPath}
                    className={`block rounded-md px-3 py-2 text-base font-medium ${
                      pathname?.startsWith("/admin")
                        ? "bg-emerald-50 text-emerald-600"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Administration
                  </Link>
                )}
                <Link
                  href="/profile"
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    pathname?.startsWith("/profile")
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Mon Profil
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-md bg-slate-100 px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-200"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/faq"
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  FAQ
                </Link>
                <Link
                  href="/auth/login"
                  className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="block rounded-md bg-emerald-600 px-3 py-2 text-center text-base font-medium text-white hover:bg-emerald-700"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
