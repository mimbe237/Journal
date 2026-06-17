import { NextResponse } from "next/server";
import { getRegistrationEnabled } from "@/modules/settings/appSettingsService";

export async function GET() {
  const registrationEnabled = await getRegistrationEnabled();
  return NextResponse.json({ registrationEnabled });
}
