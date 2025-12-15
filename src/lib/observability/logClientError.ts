/**
 * Sends client-side errors to the server for centralized logging.
 * Does nothing during SSR.
 */
export async function logClientError(message: string, context?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/log-client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context: {
          ...context,
          url: window.location.href,
          userAgent: window.navigator.userAgent,
        },
      }),
    });
  } catch (err) {
    console.error("[logClientError] failed to send", err);
  }
}
