import { createFileRoute } from '@tanstack/react-router'

import { createGuestSession, setSessionTokenCookie } from "~/server/auth";

export const Route = createFileRoute("/api/auth/guest")({
	// @ts-expect-error I don't know why this is erroring, but it is, seems correct...
	server: {
		handlers: {
			POST: async () => {
				try {
					const { token, session } = await createGuestSession();
					setSessionTokenCookie(token, new Date(session.expires_at));

					return new Response(null, {
						status: 302,
						headers: {
							Location: "/",
						},
					});
				} catch (error) {
					console.error("Guest Sign In Error:", error);
					return new Response("Internal Server Error", {
						status: 500,
					});
				}
			},
		},
	},
});
