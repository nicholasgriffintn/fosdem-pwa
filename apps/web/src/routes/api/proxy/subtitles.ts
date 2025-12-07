import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute("/api/proxy/subtitles")({
	server: {
		handlers: {
			GET: async ({ request }) => {
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

					const response = await fetch(subtitleUrl);

					if (!response.ok) {
						const responseCode = response.status;

						return new Response(
							JSON.stringify({ error: "Failed to fetch subtitle" }),
							{
								status: responseCode || 500,
								headers: {
									"Content-Type": "application/json",
								},
							},
						);
					}

					return new Response(await response.text(), {
						status: 200,
						headers: {
							"Content-Type": "text/vtt",
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
