import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";

// Route pour récupérer l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}
