import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireUserWithRoles } from "@/lib/auth/authorization";
import { getRegistrationEnabled, setRegistrationEnabled } from "@/modules/settings/appSettingsService";

export async function GET(request: NextRequest) {
  await requireUserWithRoles(request, undefined, [UserRole.SUPER_ADMIN]);
  const enabled = await getRegistrationEnabled();
  return NextResponse.json({ enabled });
}

export async function PUT(request: NextRequest) {
  await requireUserWithRoles(request, undefined, [UserRole.SUPER_ADMIN]);
  const body = await request.json().catch(() => ({}));
  const enabled = Boolean(body?.enabled);
  await setRegistrationEnabled(enabled);
  return NextResponse.json({ enabled });
}
