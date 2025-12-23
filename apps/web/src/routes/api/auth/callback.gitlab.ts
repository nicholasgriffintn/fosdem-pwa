import { createFileRoute } from "@tanstack/react-router";
import { getCookies } from "@tanstack/react-start/server";

import { GitLabOAuthHandler } from "~/server/gitlab-handler";
import { handleOAuthCallback } from "~/server/oauth-providers";

const gitlabHandler = new GitLabOAuthHandler();

export const Route = createFileRoute("/api/auth/callback/gitlab")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const url = new URL(request.url);
				const code = url.searchParams.get("code");
				const state = url.searchParams.get("state");

				const cookies = getCookies();
				const storedState = cookies.gitlab_oauth_state;

				const providerConfig = {
					id: "gitlab",
					name: "GitLab",
					scopes: ["read_user", "profile"],
					authUrl: "",
					callbackUrl: "",
					stateCookieName: "gitlab_oauth_state",
				};

				if (!code || !state) {
					return new Response(null, {
						status: 400,
					});
				}

				return handleOAuthCallback(
					providerConfig,
					gitlabHandler,
					code,
					state,
					storedState,
				);
			},
		},
	},
});
