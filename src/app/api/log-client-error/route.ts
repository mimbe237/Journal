import { NextRequest, NextResponse } from "next/server";
import { reportError } from "@/lib/observability/errorReporter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context } = body ?? {};

    if (!message) {
      return NextResponse.json({ error: "message requis" }, { status: 400 });
    }

    await reportError({
      message,
      context: { ...context, path: req.nextUrl.pathname },
      source: "client",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await reportError({ message: "log-client-error failed", error });
    return NextResponse.json({ error: "unable to log error" }, { status: 500 });
  }
}
