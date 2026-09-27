import { conferenceConfig } from "@roomisfull/conference";
import * as Sentry from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";

let isInitialised = false;

export function initSentry(router: AnyRouter) {
	if (isInitialised || typeof window === "undefined") {
		return;
	}

	Sentry.init({
		dsn: conferenceConfig.integrations.sentryWebDsn,
		integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
		sampleRate: 1,
		enableLogs: false,
		tracesSampleRate: 0,
		beforeSend(event) {
			return event.exception?.values?.length ? event : null;
		},
		beforeSendTransaction() {
			return null;
		},
		enabled: import.meta.env.PROD,
	});

	isInitialised = true;
}
