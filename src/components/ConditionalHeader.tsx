"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

export function ConditionalHeader() {
  const pathname = usePathname();

  // Masquer le Header sur la page de lecture invité
  if (pathname.startsWith("/lire/invite/")) return null;

  return <Header />;
}
