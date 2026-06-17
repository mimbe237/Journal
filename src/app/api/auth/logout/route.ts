import { NextResponse } from "next/server";

import { clearAuthCookie } from "@/lib/auth/authCookies";

// Déconnexion simple : supprime le cookie httpOnly.
export async function POST() {
  const response = NextResponse.json({ message: "Déconnecté" }, { status: 200 });
  clearAuthCookie(response);
  return response;
}
