import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_SUBTITLE_HOSTS = [
	"fosdem.org",
	"stream.fosdem.org",
	"video.fosdem.org",
	"fosdempwa.com",
	"r2.fosdempwa.com",
	"dosowisko.net",
];
const FETCH_TIMEOUT_MS = 8000;

export const Route = createFileRoute("/api/proxy/subtitles")({
	// @ts-expect-error I don't know why this is erroring, but it is, seems correct...
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				try {
					const url = new URL(request.url);
					const subtitleUrl = url.searchParams.get("url");

					if (!subtitleUrl) {
						return new Response(JSON.stringify({ error: "Missing subtitle URL" }), {
							status: 400,
							headers: {
								"Content-Type": "application/json",
							},
						});
					}

					let parsed: URL;
					try {
						parsed = new URL(subtitleUrl);
					} catch {
						return new Response(JSON.stringify({ error: "Invalid subtitle URL" }), {
							status: 400,
							headers: { "Content-Type": "application/json" },
						});
					}

					if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
						return new Response(JSON.stringify({ error: "Unsupported protocol" }), {
							status: 400,
							headers: { "Content-Type": "application/json" },
						});
					}

					const hostAllowed = ALLOWED_SUBTITLE_HOSTS.some((host) =>
						parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
					);

					if (!hostAllowed) {
						return new Response(JSON.stringify({ error: "Host not allowed" }), {
							status: 400,
							headers: { "Content-Type": "application/json" },
						});
					}

					const controller = new AbortController();
					const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
					const conditionalHeaders: Record<string, string> = {};
					const ifNoneMatch = request.headers.get("if-none-match");
					const ifModifiedSince = request.headers.get("if-modified-since");

					if (ifNoneMatch) {
						conditionalHeaders["if-none-match"] = ifNoneMatch;
					}
					if (ifModifiedSince) {
						conditionalHeaders["if-modified-since"] = ifModifiedSince;
					}

					const response = await fetch(parsed.toString(), {
						signal: controller.signal,
						headers: conditionalHeaders,
					}).finally(() => clearTimeout(timeout));

					if (!response.ok) {
						return new Response(
							JSON.stringify({ error: "Failed to fetch subtitle" }),
							{
								status: response.status || 500,
								headers: {
									"Content-Type": "application/json",
								},
							},
						);
					}

					let body: string;
					try {
						body = await response.text();
					} catch {
						return new Response(JSON.stringify({ error: "Failed to read subtitle" }), {
							status: 500,
							headers: { "Content-Type": "application/json" },
						});
					}

					const responseHeaders: Record<string, string> = {
						"Content-Type": "text/vtt",
						"Cache-Control": "public, max-age=300",
						Vary: "Origin, Accept-Encoding, If-None-Match, If-Modified-Since",
						"Access-Control-Allow-Origin": "*",
					};

					const etag = response.headers.get("etag");
					const lastModified = response.headers.get("last-modified");

					if (etag) {
						responseHeaders.ETag = etag;
					}
					if (lastModified) {
						responseHeaders["Last-Modified"] = lastModified;
					}

					return new Response(body, {
						status: 200,
						headers: responseHeaders,
					});
				} catch (error) {
					const isAbort = (error as Error)?.name === "AbortError";
					console.error("Failed to fetch subtitle:", error);
					return new Response(
						JSON.stringify({
							error: isAbort
								? "Timed out fetching subtitle"
								: "Failed to fetch subtitle",
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
