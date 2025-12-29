import { createFileRoute } from "@tanstack/react-router";

import { constants } from "~/constants";
import { CacheManager } from "~/server/cache";
import { CacheKeys } from "~/server/lib/cache-keys";

const FETCH_TIMEOUT_MS = 8000;
const CACHE_TTL_SECONDS = 60;

const cache = CacheManager.getInstance();

export const Route = createFileRoute("/api/proxy/rooms/status")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const cached = await cache.get(CacheKeys.roomStatus());
					if (cached) {
						return new Response(JSON.stringify(cached), {
							status: 200,
							headers: {
								"Content-Type": "application/json",
								"Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
							},
						});
					}

					const controller = new AbortController();
					const timeout = setTimeout(
						() => controller.abort(),
						FETCH_TIMEOUT_MS,
					);

					const response = await fetch(constants.ROOMS_API, {
						signal: controller.signal,
					}).finally(() => clearTimeout(timeout));

					if (!response.ok) {
						return new Response(
							JSON.stringify({ error: "Failed to fetch room status" }),
							{
								status: 500,
								headers: {
									"Content-Type": "application/json",
								},
							},
						);
					}

					const contentType = response.headers.get("content-type") || "";
					if (!contentType.includes("application/json")) {
						return new Response(
							JSON.stringify({ error: "Invalid response content type" }),
							{
								status: 502,
								headers: {
									"Content-Type": "application/json",
								},
							},
						);
					}

					const data = await response.json();
					await cache.set(CacheKeys.roomStatus(), data, CACHE_TTL_SECONDS);

					return new Response(JSON.stringify(data), {
						status: 200,
						headers: {
							"Content-Type": "application/json",
							"Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
						},
					});
				} catch (error) {
					const isAbort = (error as Error)?.name === "AbortError";
					console.error("Failed to fetch room status:", error);
					return new Response(
						JSON.stringify({
							error: isAbort
								? "Timed out fetching room status"
								: "Failed to fetch room status",
						}),
						{
							status: isAbort ? 504 : 500,
							headers: {
								"Content-Type": "application/json",
							},
						},
					);
				}
			},
		},
	},
});
