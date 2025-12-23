import { createFileRoute } from "@tanstack/react-router";
import { generateState } from "arctic";
import { setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { gitlab } from "~/server/auth";

export const Route = createFileRoute("/api/auth/upgrade-gitlab")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const state = generateState();

					const url = gitlab.createAuthorizationURL(state, ["read_user", "profile"]);

					setCookie("gitlab_oauth_state", state, {
						path: "/",
						secure: env.NODE_ENV === "production",
						httpOnly: true,
						maxAge: 60 * 10, // 10 minutes
						sameSite: "lax",
					});

					return new Response(null, {
						status: 302,
						headers: {
							Location: url.toString(),
						},
					});
				} catch (error) {
					console.error("GitLab Upgrade Error:", error);
					return new Response("Internal Server Error", {
						status: 500,
					});
				}
			},
		},
	},
});
