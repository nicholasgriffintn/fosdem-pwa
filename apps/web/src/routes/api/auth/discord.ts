import { createFileRoute } from "@tanstack/react-router";
import { generateState } from "arctic";
import { setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { discord } from "~/server/auth";

export const Route = createFileRoute("/api/auth/discord")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const state = generateState();

					const url = discord.createAuthorizationURL(state, null, ["identify", "email"]);

					setCookie("discord_oauth_state", state, {
						path: "/",
						secure: env.NODE_ENV === "production",
						httpOnly: true,
						maxAge: 60 * 10,
						sameSite: "lax",
					});

					return new Response(null, {
						status: 302,
						headers: {
							Location: url.toString(),
						},
					});
				} catch (error) {
					console.error("Discord Sign In Error:", error);
					return new Response("Internal Server Error", {
						status: 500,
					});
				}
			},
		},
	},
});
