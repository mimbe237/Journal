type Serializable = Record<string, unknown>;

type ReportParams = {
  message: string;
  error?: unknown;
  context?: Serializable;
  source?: "server" | "client";
};

const webhookUrl = process.env.ERROR_WEBHOOK_URL;

function serializeError(error: unknown): Serializable | undefined {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === "object") {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { value: String(error) };
    }
  }
  return { value: String(error) };
}

/**
 * Lightweight error reporter: logs to console and optionally posts to a webhook (e.g. Slack).
 * Set ERROR_WEBHOOK_URL in Vercel to forward the payload.
 */
export async function reportError(params: ReportParams) {
  const payload = {
    message: params.message,
    source: params.source ?? "server",
    context: params.context ?? {},
    error: serializeError(params.error),
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  console.error("[error]", payload);

  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `:warning: ${payload.message}\n${JSON.stringify(payload, null, 2)}` }),
    });
  } catch (err) {
    console.error("[errorReporter] webhook send failed", err);
  }
}
