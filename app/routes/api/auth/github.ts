import { createAPIFileRoute } from "@tanstack/start/api";
import { generateState } from "arctic";
import { setCookie, setHeader } from "vinxi/http";

import { github } from "~/server/auth";
import { getCloudflareEnv } from "~/server/config";

export const APIRoute = createAPIFileRoute("/api/auth/github")({
	GET: async () => {
		const env = getCloudflareEnv();
		const state = generateState();

		const url = github().createAuthorizationURL(state, ["user:email"]);

		setCookie("github_oauth_state", state, {
			path: "/",
			secure: env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 60 * 10,
			sameSite: "lax",
		});

		setHeader("Location", url.toString());

		return new Response(null, {
			status: 302,
		});
	},
});
