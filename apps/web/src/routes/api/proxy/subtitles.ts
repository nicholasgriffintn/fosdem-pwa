import { createFileRoute } from '@tanstack/react-router'

const ALLOWED_SUBTITLE_HOSTS = [
	"fosdem.org",
	"stream.fosdem.org",
	"video.fosdem.org",
	"fosdempwa.com",
	"r2.fosdempwa.com",
	"dosowisko.net",
];
const MAX_VTT_BYTES = 1_000_000; // 1MB safety cap

export const Route = createFileRoute("/api/proxy/subtitles")({
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

					const response = await fetch(parsed.toString());

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

					const contentLength = response.headers.get("content-length");
					if (contentLength && Number(contentLength) > MAX_VTT_BYTES) {
						return new Response(
							JSON.stringify({ error: "Subtitle file too large" }),
							{
								status: 413,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const contentType = response.headers.get("content-type") || "";
					if (!contentType.includes("text/vtt") && !contentType.includes("text/plain")) {
						return new Response(
							JSON.stringify({ error: "Invalid subtitle content type" }),
							{
								status: 415,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					const body = await response.text();
					if (body.length > MAX_VTT_BYTES) {
						return new Response(
							JSON.stringify({ error: "Subtitle file too large" }),
							{
								status: 413,
								headers: { "Content-Type": "application/json" },
							},
						);
					}

					return new Response(body, {
						status: 200,
						headers: {
							"Content-Type": "text/vtt",
							"Cache-Control": "public, max-age=300",
						},
					});
				} catch (error) {
					console.error("Failed to fetch subtitle:", error);
					return new Response(
						JSON.stringify({ error: "Failed to fetch subtitle" }),
						{
							status: 500,
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
