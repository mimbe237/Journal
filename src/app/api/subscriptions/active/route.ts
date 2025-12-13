import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";
import { getActiveSubscriptionForUser } from "@/modules/subscriptions/subscriptionService";

// Get active subscription for current user
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user) {
      throw new Error("Non authentifié");
    }
    if ([UserRole.SUPER_ADMIN, UserRole.FACTURATION, UserRole.SUPPORT].includes(user.role)) {
      return NextResponse.json({ subscription: null }, { status: 200 });
    }

    const subscription = await getActiveSubscriptionForUser(user.id);
    
    if (!subscription) {
      return NextResponse.json({ subscription: null }, { status: 200 });
    }
    
    return NextResponse.json({ subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Non authentifié" }, { status: 401 });
  }
}
