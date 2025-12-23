import { createFileRoute } from "@tanstack/react-router";
import { getCookies } from "@tanstack/react-start/server";

import { GitHubOAuthHandler } from "~/server/github-handler";
import { handleOAuthCallback } from "~/server/oauth-providers";

const githubHandler = new GitHubOAuthHandler();

export const Route = createFileRoute("/api/auth/callback/github")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");

				const cookies = getCookies();
				const storedState = cookies.github_oauth_state;

				const providerConfig = {
					id: "github",
					name: "GitHub",
					scopes: ["user:email"],
					authUrl: "",
					callbackUrl: "",
					stateCookieName: "github_oauth_state",
				};

				if (!code || !state) {
					return new Response(null, {
						status: 400,
					});
				}

				return handleOAuthCallback(
					providerConfig,
					githubHandler,
					code,
					state,
					storedState,
				);
			},
		},
	},
});
