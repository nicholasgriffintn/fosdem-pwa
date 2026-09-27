import { parseYear } from "./utils/year";
import { validateBuildData } from "./utils/build-validation";
import { conferenceConfig } from "@roomisfull/conference";
import * as Sentry from "@sentry/cloudflare";

import type { BuildDataResult } from "./types.js";
import { buildData } from "./providers";
import { createLogger } from "./lib/logger";
import { ensureYearFiles, uploadYearFiles } from "./lib/year-files";

const run = async (env: Env) => {
	const year = parseYear(env.YEAR ?? env.DEFAULT_YEAR ?? env.BUILD_YEAR);
	const yearString = year.value.toString();
	const logger = createLogger({
		scope: "worker",
		year: yearString,
		requestId: crypto.randomUUID(),
	});

	logger.info("Starting build", {
		year: yearString,
		source: year.source,
		clamped: year.clamped,
	});

	const template = await ensureYearFiles(env.R2, yearString, logger);
	let data: BuildDataResult;

	try {
		data = await buildData({ year: yearString });
		validateBuildData(data);
	} catch (error) {
		if (template) {
			logger.warn("Schedule unavailable; retaining template year files", {
				error: (error as Error)?.message,
			});
			return template;
		}

		throw error;
	}

	await uploadYearFiles(env.R2, data, yearString, logger);

	return data;
};

export default Sentry.withSentry<Env, unknown>(
	(env) => ({
		dsn: conferenceConfig.integrations.sentryBuildDsn,
		sampleRate: 1,
		enableLogs: false,
		tracesSampleRate: 0,
		beforeSend(event) {
			return event.exception?.values?.length ? event : null;
		},
		beforeSendTransaction() {
			return null;
		},
	}),
	{
		async fetch(request, env, ctx): Promise<Response> {
			const data = await run(env);

			return Response.json(data);
		},
		async scheduled(event: any, env: any, ctx: any) {
			ctx.waitUntil(run(env));
		},
	} satisfies ExportedHandler<Env>,
);
