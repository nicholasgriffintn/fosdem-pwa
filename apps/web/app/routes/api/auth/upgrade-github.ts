import { createAPIFileRoute } from "@tanstack/start/api";
import { generateState } from "arctic";
import { setCookie, setHeader } from "vinxi/http";

import { github } from "~/server/auth";
import { getCloudflareEnv } from "~/server/config";

export const APIRoute = createAPIFileRoute("/api/auth/upgrade-github")({
	GET: async () => {
		try {
			const env = getCloudflareEnv();
			const state = generateState();

			const url = github.createAuthorizationURL(state, ["user:email"]);

			setCookie("github_oauth_state", state, {
				path: "/",
				secure: env.NODE_ENV === "production",
				httpOnly: true,
				maxAge: 60 * 10, // 10 minutes
				sameSite: "lax",
			});

			setHeader("Location", url.toString());

			return new Response(null, {
				status: 302,
			});
		} catch (error) {
			console.error("GitHub Upgrade Error:", error);
			return new Response("Internal Server Error", {
				status: 500,
			});
		}
	},
});
