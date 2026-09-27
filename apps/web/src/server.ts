import { env } from "cloudflare:workers";
import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { deployment } from "@roomisfull/conference/deployment";

import { handleDeploymentRequest } from "./server/lib/deployment-request";
import { shouldNoIndex } from "./utils/canonical";

const handleStart = createStartHandler(defaultStreamHandler);

export default {
	async fetch(request: Request) {
		const redirect = handleDeploymentRequest(
			request,
			deployment,
			import.meta.env.DEV,
		);

		if (redirect) {
			return redirect;
		}

		if (request.method === "GET" || request.method === "HEAD") {
			const asset = await env.ASSETS.fetch(request);
			if (asset.status !== 404) {
				return asset;
			}
		}

		const response = await handleStart(request);

		if (shouldNoIndex(request.url) || response.status >= 400) {
			const headers = new Headers(response.headers);
			headers.set("X-Robots-Tag", "noindex, follow");

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			});
		}

		return response;
	},
};
