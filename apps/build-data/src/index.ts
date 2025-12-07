import * as Sentry from "@sentry/cloudflare";

import { buildData } from "./lib/fosdem";

const run = async (env: any) => {
	const year = "2026";
	const data = await buildData({ year });

	await env.R2.put(`fosdem-${year}.json`, JSON.stringify(data, null, 2));

	return data;
};

export default Sentry.withSentry(
	env => ({
		dsn: "https://828f2b60a22b55556e8be6aa87517acf@o4508599344365568.ingest.de.sentry.io/4508734045814864",
		// Set tracesSampleRate to 1.0 to capture 100% of spans for tracing.
		// Learn more at
		// https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
		tracesSampleRate: 1.0,
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
