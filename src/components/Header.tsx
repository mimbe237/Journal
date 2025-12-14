"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nom: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role === "SUPER_ADMIN" || user?.role === "FACTURATION" || user?.role === "SUPPORT";

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
    const allowedPaths = ["/editions", "/dashboard", "/profile"];
    const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

    if (isStaff && !pathname.startsWith("/admin") && !isAllowedPath) {
      const target = user.role === "FACTURATION"
        ? "/admin/facturation"
        : user.role === "SUPPORT"
          ? "/admin/support"
          : "/admin";
      router.replace(target);
    }
  }, [user, pathname, router, isStaff]);

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
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="text-xl font-bold text-slate-900">
          Journal Numérique
        </Link>

        <nav className="flex items-center gap-6">
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
                <span className="text-sm text-slate-600">{user.nom}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Déconnexion
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
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
    </header>
  );
}
