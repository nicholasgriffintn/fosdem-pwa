import * as Sentry from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";

let isInitialised = false;

export function initSentry(router: AnyRouter) {
  if (isInitialised || typeof window === "undefined") {
    return;
  }

  Sentry.init({
    dsn: "https://52b654d9455a44b0b822cee104d62dd6@ingest.bitwobbly.com/api/9",
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: 0.1,
    enabled: import.meta.env.PROD,
  });

  isInitialised = true;
}
