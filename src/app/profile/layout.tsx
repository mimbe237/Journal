import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/currentUser";

/**
 * Layout protégé pour l'espace profil.
 * Si l'utilisateur n'est pas authentifié, on le redirige vers la page de connexion.
 */
export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    // Redirige vers la connexion avec un redirect basique vers le profil
    redirect("/auth/login?redirect=/profile");
  }

  return <>{children}</>;
}
